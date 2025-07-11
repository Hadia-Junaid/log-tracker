import { Request, Response, NextFunction } from "express";
import googleAuthService from "../services/googleAuthService";
import jwtService from "../services/jwtService";
import User from "../models/User";
import logger from "../utils/logger";
import config from "config";
import tempCodeManager from "../utils/tempCodeManager";
import { checkUserAdminStatus } from "../utils/checkAdminStatus";

class AuthController {
    async googleLogin(req: Request, res: Response): Promise<void> {
        const authUrl = googleAuthService.generateAuthUrl();
        res.status(200).json({
            authUrl,
            message: "Redirect to Google OAuth",
        });
    }

    async googleCallback(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.query;

            if (!code || typeof code !== "string") {
                res.redirect(
                    `${config.get<string>("frontend.baseUrl")}/#login?error=missing_code&message=Authorization code is required. Please try again.`
                );
                return;
            }

            const googleUserInfo =
                await googleAuthService.authenticateUser(code);
            logger.info(`Google user info: ${JSON.stringify(googleUserInfo)}`);

            // Check if user exists in MongoDB
            const existingUser = await User.findOne({
                email: googleUserInfo.email,
            });

            if (!existingUser) {
                logger.warn(
                    `Access denied for user: ${googleUserInfo.email} - User not found in database`
                );
                res.redirect(
                    `${config.get<string>("frontend.baseUrl")}/#login?error=access_denied&message=Access denied. Please contact your administrator.`
                );
                return;
            }

            if (existingUser.name !== googleUserInfo.name) {
                existingUser.name = googleUserInfo.name;
                await existingUser.save();
            }

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
        } catch (error) {
            logger.error("Google OAuth callback error:", error);
            res.redirect(
                `${config.get<string>("frontend.baseUrl")}/#login?error=auth_failed&message=Authentication failed. Please try again.`
            );
        }
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
            },
        });
    }

    async logout(req: Request, res: Response): Promise<void> {
        const user = req.user;
        const userEmail = user?.email;
        const userId = user?.id;

        logger.info(`Logout initiated for user: ${userEmail} (ID: ${userId})`);

        try {
            await googleAuthService.revokeTokens();
            logger.info(
                `Google tokens revoked successfully for user: ${userEmail}`
            );
        } catch (revokeError) {
            logger.warn(
                `Failed to revoke Google tokens for user ${userEmail}:`,
                revokeError
            );
        }

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
            res.status(200).json({ authenticated: false });
            return;
        }

        try {
            const decoded = jwtService.verifyToken(token);
            const user = await User.findById(decoded.userId);

            if (!user) {
                res.status(200).json({ authenticated: false });
                return;
            }

            // Check current admin status
            const isAdmin = await checkUserAdminStatus(user.email);

            res.status(200).json({
                authenticated: true,
                user: {
                     _id: user._id,
                    email: user.email,
                    name: user.name,
                    settings: user.settings,
                    pinned_applications: user.pinned_applications,
                    is_admin: isAdmin,
                },
            });
        } catch (err) {
            logger.error("Token verification error:", err);
            res.status(200).json({ authenticated: false });
        }
    }
}

export default new AuthController();
