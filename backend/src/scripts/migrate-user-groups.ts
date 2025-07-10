import mongoose from 'mongoose';
import config from 'config';
import UserGroup from '../models/UserGroup';

async function migrateUserGroups(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || '';
    console.log('mongoUri', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all UserGroup documents that don't have the is_active field
    const userGroupsWithoutIsActive = await UserGroup.find({
      is_active: { $exists: false }
    });

    console.log(`Found ${userGroupsWithoutIsActive.length} UserGroup documents without is_active field`);

    if (userGroupsWithoutIsActive.length === 0) {
      console.log('No documents need migration. All UserGroup documents already have is_active field.');
      return;
    }

    // Update all documents to add is_active: true (default value)
    const updateResult = await UserGroup.updateMany(
      { is_active: { $exists: false } },
      { $set: { is_active: true } }
    );

    console.log(`Successfully updated ${updateResult.modifiedCount} UserGroup documents`);
    console.log('Migration completed successfully!');

    // Verify the migration
    const remainingWithoutIsActive = await UserGroup.find({
      is_active: { $exists: false }
    });

    if (remainingWithoutIsActive.length === 0) {
      console.log('✅ Verification passed: All UserGroup documents now have is_active field');
    } else {
      console.log(`⚠️  Warning: ${remainingWithoutIsActive.length} documents still missing is_active field`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateUserGroups()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateUserGroups }; 