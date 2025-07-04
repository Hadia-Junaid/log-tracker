import { Request, Response } from 'express';
import { getAdminDirectoryService } from '../utils/googleAdminSDK';
import config from 'config';
import { searchUsersSchema } from '../validators/admin';

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
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
    // Joi validation
    const { error, value } = searchUsersSchema.validate(req.query);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { searchString:query } = value;
    const admin = await getDirectoryService();
    const domain = config.get<string>('google.admin.domain');
    
    // Build server-side query for filtering users by name or email
    // Google Admin SDK query syntax: https://developers.google.com/admin-sdk/directory/v1/guides/search-users
    // Use no field specified to search across givenName, familyName, and email
    // const query = searchString;
    
    let allUsers: any[] = [];
    let nextPageToken: string | undefined = undefined;
    
    // Implement pagination to get ALL users
    do {
        let response;
        
        if (domain) {
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