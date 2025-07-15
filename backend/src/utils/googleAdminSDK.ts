import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import config from 'config';
import { JWT } from 'google-auth-library';
import logger from './logger';

// Get configuration values using the config package
const SERVICE_ACCOUNT_KEY_PATH = config.get<string>('google.admin.serviceAccountKeyPath');
const ADMIN_IMPERSONATION_EMAIL = config.get<string>('google.admin.adminImpersonationEmail');
const ADMIN_SCOPES_STRING = config.get<string>('google.admin.adminScopes');

if (!SERVICE_ACCOUNT_KEY_PATH || !ADMIN_IMPERSONATION_EMAIL || !ADMIN_SCOPES_STRING) {
    logger.error("Missing Google Admin SDK configuration. Please check your config files.");
    process.exit(1); // Exit if critical variables are missing
}

const ADMIN_SCOPES = ADMIN_SCOPES_STRING.split(',');

let adminDirectoryService: any = null;

/**
 * Initializes and returns the Google Admin SDK Directory API service client.
 * Uses a Service Account with Domain-Wide Delegation.
 */
export const getAdminDirectoryService = async () => {
    if (adminDirectoryService) {
        return adminDirectoryService; // Return existing instance if already initialized
    }

        // Load the service account credentials from the JSON file
        const auth = new GoogleAuth({
            keyFile: SERVICE_ACCOUNT_KEY_PATH,
            scopes: ADMIN_SCOPES,
        });

        // Delegate authority to the specified Google Workspace Super Admin
        const client = await auth.getClient() as JWT;
        client.subject = ADMIN_IMPERSONATION_EMAIL;

        // Build the Admin SDK Directory service
        adminDirectoryService = google.admin({
            version: 'directory_v1',
            auth: client, // Use the delegated authentication
        });

        logger.info('Google Admin SDK Directory Service initialized successfully.');
        return adminDirectoryService;
};
