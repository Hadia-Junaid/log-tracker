import { Request, Response, NextFunction } from 'express';
import { getAdminDirectoryService } from '../utils/googleAdminSDK';
import config from 'config';
import { searchUsersSchema, patchUserAndGroupSchema } from '../validators/admin';

// Helper to get an instance of the Admin SDK Directory service
const getDirectoryService = async () => {
    const service = await getAdminDirectoryService();
    if (!service) {
        throw new Error('Admin SDK service not initialized.');
    }
    return service;
};

/**
 * GET API endpoint: Accepts a search string, Returns filtered users (name + email) from the org's Google Chat directory
 */
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    // Joi validation
    const { error, value } = searchUsersSchema.validate(req.query);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { searchString } = value;
    const admin = await getDirectoryService(); // Will throw and be caught by asyncHandler if fails
    const domain = config.get<string>('google.admin.domain');
    
    let response;
    
    // Try different approaches in order of preference
    if (domain) {
        // Approach 1: Use domain if configured
        response = await admin.users.list({
            domain: domain,
            maxResults: 100,
            orderBy: 'email'
        });
    } else {
        // Approach 2: Use customer if no domain configured
        try {
            response = await admin.users.list({
                customer: 'my_customer',
                maxResults: 100,
                orderBy: 'email'
            });
        } catch (customerError: any) {
            // Approach 3: Minimal parameters as last resort
            response = await admin.users.list({
                maxResults: 100
            });
        }
    }

    // Filter results locally
    const allUsers = response.data.users || [];
    
    const users = allUsers
        .filter((user: any) => {
            const fullName = user.name?.fullName?.toLowerCase() || '';
            const email = user.primaryEmail?.toLowerCase() || '';
            const search = searchString.toLowerCase();
            return fullName.includes(search) || email.includes(search);
        })
        .map((user: any) => ({
            name: user.name?.fullName,
            email: user.primaryEmail,
        }))
        .slice(0, 20); // Limit to 20 results

    res.status(200).json(users);
};

/**
 * PATCH API endpoint: Accepts selected directory user, verifies user exists in Chat Directory,
 * Adds user to specified group and to the users table if being added for the first time.
 */
export const patchUserAndGroup = async (req: Request, res: Response, next: NextFunction) => {
    // Joi validation
    const { error, value } = patchUserAndGroupSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { userEmail, groupId, userName } = value;
    const admin = await getDirectoryService(); // Will throw and be caught by asyncHandler if fails

    // 1. Verify user exists in Chat Directory (Admin SDK Directory API)
    let existingUser;
    try {
        const userResponse = await admin.users.get({ userKey: userEmail });
        existingUser = userResponse.data;
    } catch (userError: any) {
        if (userError.code === 404) {
            return res.status(404).json({ message: `User ${userEmail} not found in Google Directory.` });
        }
        if (userError.code === 403) {
            return res.status(403).json({ 
                message: 'Permission denied when verifying user existence.',
                details: 'Service account needs domain-wide delegation and proper scopes for user access',
                userEmail: userEmail
            });
        }
        // Let other errors be handled by centralized error handler
        throw userError;
    }

    // 2. Add user to specified group
    try {
        await admin.members.insert({
            groupKey: groupId,
            requestBody: { email: userEmail },
        });
    } catch (groupError: any) {
        if (groupError.code === 409) { // 409 Conflict if member already exists
            // This is expected, user already in group - continue
        } else {
            // Let other group errors be handled by centralized error handler
            throw groupError;
        }
    }

    // 3. Add user to the users table if being added for the first time
    const User = require('../models/User').default;
    let userInDB = await User.findOne({ email: userEmail });
    
    if (!userInDB) {
        // Create new user in your database
        const newUser = new User({
            email: userEmail,
            name: userName || existingUser.name?.fullName,
        });
        await newUser.save(); // Any DB errors will be caught by asyncHandler
    }

    res.status(200).json({ 
        message: 'User processed successfully.', 
        user: { 
            email: userEmail, 
            name: userName || existingUser.name?.fullName 
        } 
    });
};