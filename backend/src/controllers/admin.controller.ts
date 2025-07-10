import { Request, Response } from 'express';
import { getAdminDirectoryService } from '../utils/googleAdminSDK';
import config from 'config';
import { searchUsersSchema } from '../validators/admin';

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = searchUsersSchema.validate(req.query);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const { searchString: query } = value;
  const admin = await getAdminDirectoryService();
  const domain = config.get<string>('google.admin.domain');

  let allUsers: any[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await admin.users.list({
      domain,
      query,
      orderBy: 'email',
      maxResults: 500,
      pageToken: nextPageToken,
      projection: 'full' // 👈 this may include thumbnailPhotoUrl
    });

    if (response?.data.users) {
      allUsers = allUsers.concat(response.data.users);
    }

    nextPageToken = response?.data.nextPageToken;
  } while (nextPageToken);

  // Now return name, email, and thumbnailPhotoUrl (if available)
  const users = allUsers.map(user => ({
    name: user.name?.fullName,
    email: user.primaryEmail,
    photo: user.thumbnailPhotoUrl || null
  }));

  res.status(200).json(users);
};
