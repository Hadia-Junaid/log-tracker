import { Request, Response, NextFunction } from "express";
import googleAuthService from "../services/googleAuthService";
import jwtService from "../services/jwtService";
import User from "../models/User";
import UserGroup from "../models/UserGroup";
import logger from "../utils/logger";
import config from "config";
import tempCodeManager from "../utils/tempCodeManager";
import { checkUserAdminStatus } from "../utils/checkAdminStatus";
import { getUserGroups } from "../utils/getUserGroups";

class AuthController {
    async googleLogin(req: Request, res: Response): Promise<void> {
        const authUrl = googleAuthService.generateAuthUrl();
        res.status(200).json({
            authUrl,
            message: "Redirect to Google OAuth",
        });
    }

    async googleCallback(req: Request, res: Response): Promise<void> {
        const { code } = req.query;

        if (!code || typeof code !== "string") {
            res.redirect(
                `${config.get<string>("frontend.baseUrl")}/#login?error=missing_code&message=Authorization code is required. Please try again.`
            );
            return;
        }

        const googleUserInfo = await googleAuthService.authenticateUser(code);
        logger.info(`Google user info: ${JSON.stringify(googleUserInfo)}`);

        // 1. Find the user in your database
        const existingUser = await User.findOne({
            email: googleUserInfo.email,
        });

        // If the user doesn't even exist in the Users collection, deny access.
        if (!existingUser) {
            logger.warn(
                `Access denied for user: ${googleUserInfo.email} - User not found in database`
            );
            const message = encodeURIComponent(
                "Access Denied. Please contact your administrator."
            );
            res.redirect(
                `${config.get<string>("frontend.baseUrl")}/#login?error=access_denied&message=${message}`
            );
            return;
        }

        // Update user name if it changed
        if (existingUser.name !== googleUserInfo.name) {
            existingUser.name = googleUserInfo.name;
            await existingUser.save();
        }

        // 2. Check if the user is a member of ANY UserGroup
        const groupMembership = await UserGroup.findOne({
            members: existingUser._id,
            is_active: true,
        });

        // 3. If they are NOT in any group, they are an "orphaned" user.
        if (!groupMembership) {
            logger.warn(
                `Orphaned user detected: ${existingUser.email} - User not in any active group, deleting user`
            );

            // As per your requirement, delete the user from the User collection
            await User.findByIdAndDelete(existingUser._id);

            // Redirect back to the login page with an access denied message
            const message = encodeURIComponent(
                "Access Denied. Please contact your administrator."
            );
            res.redirect(
                `${config.get<string>("frontend.baseUrl")}/#login?error=access_denied&message=${message}`
            );
            return;
        }

        // 4. If they ARE in a group, proceed with normal login.
        const tempCode = tempCodeManager.generateTempCode({
            userId: (existingUser._id as any).toString(),
            email: existingUser.email,
            name: existingUser.name,
        });

        logger.info(
            `User successfully authenticated: ${existingUser.email}, temporary code generated`
        );

        res.redirect(
            `${config.get<string>("frontend.baseUrl")}/#login?auth_code=${tempCode}`
        );

        logger.info(
            `Redirecting to frontend with temporary code for user: ${existingUser.email}`
        );
    }

    async exchangeAuthCode(req: Request, res: Response): Promise<void> {
        const { auth_code } = req.body;

        const tempCodeData = tempCodeManager.getTempCodeData(auth_code);

        if (!tempCodeData) {
            res.status(400).json({
                message: "Invalid or expired authorization code",
            });
            return;
        }

        if (tempCodeManager.isExpired(tempCodeData)) {
            tempCodeManager.deleteTempCode(auth_code);
            res.status(400).json({
                message: "Authorization code has expired",
            });
            return;
        }

        // Get fresh user data from database
        const user = await User.findById(tempCodeData.userId);

        if (!user) {
            tempCodeManager.deleteTempCode(auth_code);
            res.status(400).json({
                message: "User not found",
            });
            return;
        }

        // Check if user is admin by checking membership in admin groups
        const isAdmin = await checkUserAdminStatus(user.email);
        const userGroups = await getUserGroups(user.id.toString());

        const token = jwtService.generateToken(user, isAdmin);
        tempCodeManager.deleteTempCode(auth_code);
        logger.info(
            `JWT token generated for user: ${user.email}, admin status: ${isAdmin}`
        );

        logger.info(
            "Setting JWT token in response cookie for user: " +
                user.email +
                token
        );
        //set the JWT token in the response cookie
        res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: "lax", // or 'strict' if tighter control needed
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                settings: user.settings,
                pinned_applications: user.pinned_applications,
                is_admin: isAdmin,
                groups: userGroups.map((group) => ({
                    id: group._id,
                    name: group.name,
                    is_admin: group.is_admin,
                })),
            },
        });
    }

    async logout(req: Request, res: Response): Promise<void> {
        const user = req.user;
        const userEmail = user?.email;
        const userId = user?.id;

        if (!user) {
            res.status(404).json({
                message: "No user information found",
            });
            return;
        }

        logger.info(`Logout initiated for user: ${userEmail} (ID: ${userId})`);

        await googleAuthService.revokeTokens(); // Errors here will be passed to errorHandler

        logger.info(
            `Google tokens revoked successfully for user: ${userEmail}`
        );
        logger.info(`User logged out successfully: ${userEmail}`);

        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
        });

        res.status(200).json({
            message: "Logged out successfully",
            user: {
                email: userEmail,
            },
        });
    }

    async verifyToken(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Access token is required",
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = jwtService.verifyToken(token);

        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Check current admin status (in case it changed since token was issued)
        const isAdmin = await checkUserAdminStatus(user.email);

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                settings: user.settings,
                pinned_applications: user.pinned_applications,
                is_admin: isAdmin,
            },
        });
    }

    async getAuthStatus(req: Request, res: Response): Promise<void> {
        const token = req.cookies?.jwt;

        if (!token) {
            res.status(401).json({ authenticated: false });
            return;
        }

        const decoded = jwtService.verifyToken(token); // throws if invalid
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(404).json({ authenticated: false });
            return;
        }

        // Check current admin status from database instead of relying on token
        const isAdmin = await checkUserAdminStatus(user.email);

        // Get user groups for additional context
        const userGroups = await getUserGroups(user.id.toString());

        res.status(200).json({
            authenticated: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                settings: user.settings,
                pinned_applications: user.pinned_applications,
                is_admin: isAdmin,
                groups: userGroups.map((group) => ({
                    id: group._id,
                    name: group.name,
                    is_admin: group.is_admin,
                })),
            },
        });
    }
}

export default new AuthController();
