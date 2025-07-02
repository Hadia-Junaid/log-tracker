import UserGroup from '../models/UserGroup';
import User from '../models/User';
import logger from './logger';

/**
 * Check if a user is admin by verifying their membership in admin groups
 * @param userEmail - Email of the user to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export const checkUserAdminStatus = async (userEmail: string): Promise<boolean> => {
  try {
    // Find the user by email to get their ObjectId
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      logger.warn(`User not found with email: ${userEmail}`);
      return false;
    }

    // Find all admin groups where is_admin is true
    const adminGroup = await UserGroup.findOne({ is_admin: true });
    
    if (!adminGroup) {
      logger.info('No admin groups found in the system');
      return false;
    }

      if (adminGroup.members.includes(user._id as any)) {
        logger.info(`User ${userEmail} found in admin group: ${adminGroup.name}`);
        return true;
      }

    logger.info(`User ${userEmail} is not a member of any admin group`);
    return false;

  } catch (error) {
    logger.error(`Error checking admin status for user ${userEmail}:`, error);
    return false;
  }
}; 