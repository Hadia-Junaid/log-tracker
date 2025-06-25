// Load environment variables from .env file
require('dotenv').config();

const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const config = require('config');

// Test script to verify Google Admin SDK configuration
async function testGoogleAdminSDK() {
    console.log('🔍 Testing Google Admin SDK Configuration...\n');

    try {
        // Check environment variables directly first
        console.log('🌍 Environment Variables Check:');
        console.log(`   GOOGLE_SERVICE_ACCOUNT_KEY_PATH: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || 'NOT SET'}`);
        console.log(`   GOOGLE_ADMIN_IMPERSONATION_EMAIL: ${process.env.GOOGLE_ADMIN_IMPERSONATION_EMAIL || 'NOT SET'}`);
        console.log(`   GOOGLE_ADMIN_SCOPES: ${process.env.GOOGLE_ADMIN_SCOPES || 'NOT SET'}`);
        console.log(`   GOOGLE_WORKSPACE_DOMAIN: ${process.env.GOOGLE_WORKSPACE_DOMAIN || 'NOT SET'}\n`);

        // Check configuration values
        const SERVICE_ACCOUNT_KEY_PATH = config.get('google.admin.serviceAccountKeyPath');
        const ADMIN_IMPERSONATION_EMAIL = config.get('google.admin.adminImpersonationEmail');
        const ADMIN_SCOPES_STRING = config.get('google.admin.adminScopes');
        const DOMAIN = config.get('google.admin.domain');

        console.log('📋 Config Package Values:');
        console.log(`   Service Account Path: ${SERVICE_ACCOUNT_KEY_PATH || 'NOT SET'}`);
        console.log(`   Impersonation Email: ${ADMIN_IMPERSONATION_EMAIL || 'NOT SET'}`);
        console.log(`   Scopes: ${ADMIN_SCOPES_STRING || 'NOT SET'}`);
        console.log(`   Domain: ${DOMAIN || 'NOT SET'}\n`);

        if (!SERVICE_ACCOUNT_KEY_PATH || !ADMIN_IMPERSONATION_EMAIL || !ADMIN_SCOPES_STRING) {
            throw new Error('Missing required configuration. Please check your environment variables.');
        }

        const ADMIN_SCOPES = ADMIN_SCOPES_STRING.split(',');

        // Initialize Google Auth
        console.log('🔐 Initializing Google Authentication...');
        const auth = new GoogleAuth({
            keyFile: SERVICE_ACCOUNT_KEY_PATH,
            scopes: ADMIN_SCOPES,
        });

        const client = await auth.getClient();
        client.subject = ADMIN_IMPERSONATION_EMAIL;

        // Build Admin SDK service
        const admin = google.admin({
            version: 'directory_v1',
            auth: client,
        });

        console.log('✅ Authentication successful!\n');

        // Test different list approaches
        console.log('🧪 Testing User List API calls...\n');

        if (DOMAIN) {
            try {
                console.log(`   Testing with domain: ${DOMAIN}`);
                const response = await admin.users.list({
                    domain: DOMAIN,
                    maxResults: 5,
                });
                console.log(`   ✅ Domain approach worked! Found ${response.data.users?.length || 0} users`);
                if (response.data.users && response.data.users.length > 0) {
                    console.log(`   📧 Sample user: ${response.data.users[0].primaryEmail}`);
                }
            } catch (domainError) {
                console.log(`   ❌ Domain approach failed: ${domainError.message}`);
            }
        }

        try {
            console.log('   Testing with customer: Bilal');
            const response = await admin.users.list({
                customer: 'Bilal',
                maxResults: 5,
            });
            console.log(`   ✅ Customer approach worked! Found ${response.data.users?.length || 0} users`);
            if (response.data.users && response.data.users.length > 0) {
                console.log(`   📧 Sample user: ${response.data.users[0].primaryEmail}`);
            }
        } catch (customerError) {
            console.log(`   ❌ Customer approach failed: ${customerError.message}`);
        }


        console.log('\n🎉 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code) {
            console.error(`   Error code: ${error.code}`);
        }
        if (error.errors) {
            console.error('   Detailed errors:', JSON.stringify(error.errors, null, 2));
        }
    }
}

// Run the test
testGoogleAdminSDK(); 