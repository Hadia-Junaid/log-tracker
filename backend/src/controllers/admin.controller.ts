import { Request, Response, NextFunction } from 'express';
import { getAdminDirectoryService } from '../utils/googleAdminSDK';
import config from 'config';
import { searchUsersSchema } from '../validators/admin';

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
    
    // Build server-side query for filtering users by name or email
    // Google Admin SDK query syntax: https://developers.google.com/admin-sdk/directory/v1/guides/search-users
    // Use no field specified to search across givenName, familyName, and email
    const query = searchString;
    
    let allUsers: any[] = [];
    let nextPageToken: string | undefined = undefined;
    
    // Implement pagination to get ALL users
    do {
        let response;
        
        if (domain) {
            // Approach 1: Use domain if configured
            response = await admin.users.list({
                domain: domain,
                query: query,
                orderBy: 'email',
                maxResults: 500, // Maximum allowed per request
                pageToken: nextPageToken
            });
        }
        
        if (response?.data.users) {
            allUsers = allUsers.concat(response.data.users);
        }
        
        nextPageToken = response?.data.nextPageToken;
    } while (nextPageToken);
    
    const users = allUsers.map((user: any) => ({
        name: user.name?.fullName,
        email: user.primaryEmail,
    }));

    res.status(200).json(users);
};

// /**
//  * PATCH API endpoint: Accepts selected directory user, verifies user exists in Chat Directory,
//  * Adds user to specified group and to the users table if being added for the first time.
//  */
// export const patchUserAndGroup = async (req: Request, res: Response, next: NextFunction) => {
//     // Joi validation
//     const { error, value } = patchUserAndGroupSchema.validate(req.body);
//     if (error) {
//         return res.status(400).json({ message: error.details[0].message });
//     }

//     const { userEmail, groupId, userName } = value;
//     const admin = await getDirectoryService(); // Will throw and be caught by asyncHandler if fails

//     // 1. Verify user exists in Chat Directory (Admin SDK Directory API)
//     let existingUser;
//     try {
//         const userResponse = await admin.users.get({ userKey: userEmail });
//         existingUser = userResponse.data;
//     } catch (userError: any) {
//         if (userError.code === 404) {
//             return res.status(404).json({ message: `User ${userEmail} not found in Google Directory.` });
//         }
//         if (userError.code === 403) {
//             return res.status(403).json({ 
//                 message: 'Permission denied when verifying user existence.',
//                 details: 'Service account needs domain-wide delegation and proper scopes for user access',
//                 userEmail: userEmail
//             });
//         }
//         // Let other errors be handled by centralized error handler
//         throw userError;
//     }

//     // 2. Add user to specified group
//     try {
//         await admin.members.insert({
//             groupKey: groupId,
//             requestBody: { email: userEmail },
//         });
//     } catch (groupError: any) {
//         if (groupError.code === 409) { // 409 Conflict if member already exists
//             // This is expected, user already in group - continue
//         } else {
//             // Let other group errors be handled by centralized error handler
//             throw groupError;
//         }
//     }

//     // 3. Add user to the users table if being added for the first time
//     const User = require('../models/User').default;
//     let userInDB = await User.findOne({ email: userEmail });
    
//     if (!userInDB) {
//         // Create new user in your database
//         const newUser = new User({
//             email: userEmail,
//             name: userName || existingUser.name?.fullName,
//         });
//         await newUser.save(); // Any DB errors will be caught by asyncHandler
//     }

//     res.status(200).json({ 
//         message: 'User processed successfully.', 
//         user: { 
//             email: userEmail, 
//             name: userName || existingUser.name?.fullName 
//         } 
//     });
// };