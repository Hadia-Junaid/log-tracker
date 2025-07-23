import { Request, Response } from 'express';
import { getAdminDirectoryService } from '../utils/googleAdminSDK';
import { admin_directory_v1 } from 'googleapis';
import config from 'config';
import { searchUsersSchema } from '../validators/admin';
import logger from '../utils/logger';

type Schema$User = admin_directory_v1.Schema$User;

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const MAX_RESULTS = config.get<number>('adminSearch.maxResults');
  const ORDER_BY = config.get<string>('adminSearch.orderBy');
  const PROJECTION = config.get<string>('adminSearch.projection');
  const { error, value } = searchUsersSchema.validate(req.query); 
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const { searchString: query } = value;
  const admin = await getAdminDirectoryService();
  const domain = config.get<string>('google.admin.domain');
  
  let allUsers: Schema$User[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await admin.users.list({
      domain,
      query,
      orderBy: ORDER_BY,
      maxResults: MAX_RESULTS,
      pageToken: nextPageToken,
      projection: PROJECTION
    });

    if (response?.data.users) {
      allUsers = allUsers.concat(response.data.users);
    }

    nextPageToken = response?.data.nextPageToken;
  } while (nextPageToken);

  logger.info(`✅ Found ${allUsers.length} users matching query: ${query}`);
  // Now return name, email

  const users = allUsers
  .filter(user => user.suspended === false && user.archived===false && user.organizations?.[0]?.description?.toLowerCase() !== 'exempted')
  .map(user => ({
    name: user.name?.fullName,
    email: user.primaryEmail,
  }));


  res.status(200).json(users);
  return;
};
