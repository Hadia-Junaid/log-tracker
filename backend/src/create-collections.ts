// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

// Import existing models
import Application from './models/Application';
import User from './models/User';
import UserGroup from './models/UserGroup';
import Log from './models/Log';
import AtRiskRule from './models/AtRiskRule';

// MongoDB connection string from environment variables
const MONGODB_URI: string | undefined = process.env['MONGODB_URI'];

// Validate that MONGODB_URI is provided
if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is not set. Please check your .env file.');
  process.exit(1);
}

async function createCollections(): Promise<void> {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!, {
      // MongoDB Atlas connection options
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB successfully!');

    // Get database instance
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    // Create the LogTracker database by inserting a dummy document
    console.log('Creating LogTracker database...');
    try {
      // Insert a dummy document to create the database
      await db.collection('_database_creation').insertOne({ 
        created_at: new Date(),
        purpose: 'Database creation trigger'
      });
      
      // Remove the dummy document
      await db.collection('_database_creation').deleteOne({ 
        purpose: 'Database creation trigger' 
      });
      
      console.log('✅ LogTracker database created successfully!');
    } catch (error) {
      console.log('ℹ️  LogTracker database may already exist or creation failed:', (error as Error).message);
    }

    // Create collections if they don't exist
    const collections: string[] = ['applications', 'users', 'usergroups', 'logs', 'atriskrules'];
    
    for (const collectionName of collections) {
      try {
        // Check if collection exists
        const existingCollections = await db.listCollections({ name: collectionName }).toArray();
        
        if (existingCollections.length === 0) {
          // Create collection
          await db.createCollection(collectionName);
          console.log(`✅ Created collection: ${collectionName}`);
        } else {
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating collection ${collectionName}:`, (error as Error).message);
      }
    }

    // Create indexes for better performance
    console.log('\nCreating indexes...');
    
    // Application indexes
    await Application.createIndexes();
    console.log('✅ Created indexes for Application collection');
    
    // User indexes
    await User.createIndexes();
    console.log('✅ Created indexes for User collection');
    
    // UserGroup indexes
    await UserGroup.createIndexes();
    console.log('✅ Created indexes for UserGroup collection');
    
    // Log indexes
    await Log.createIndexes();
    console.log('✅ Created indexes for Log collection');
    
    // AtRiskRule indexes
    await AtRiskRule.createIndexes();
    console.log('✅ Created indexes for AtRiskRule collection');

    console.log('\n🎉 All collections and indexes created successfully!');
    
    // List all collections
    const allCollections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    allCollections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

// Run the script
createCollections().catch((error: Error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
}); 