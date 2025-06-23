// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Validate that MONGODB_URI is provided
if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is not set. Please check your .env file.');
  process.exit(1);
}

// Define schemas
const ApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hostname: { type: String, required: true },
  environment: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  pinned_applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  settings: {
    autoRefresh: Boolean,
    autoRefreshTime: Number,
    logsPerPage: Number,
  }
}, { timestamps: true });

const UserGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
  assigned_applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const LogSchema = new mongoose.Schema({
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  timestamp: { type: Date, required: true },
  log_level: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

const AtRiskRuleSchema = new mongoose.Schema({
  type_of_logs: { type: String, required: true },
  operator: { type: String, required: true },
  unit: { type: String, required: true },
  time: { type: Number, required: true },
  number_of_logs: { type: Number, required: true }
}, { timestamps: true });

// Create models
const Application = mongoose.model('Application', ApplicationSchema);
const User = mongoose.model('User', UserSchema);
const UserGroup = mongoose.model('UserGroup', UserGroupSchema);
const Log = mongoose.model('Log', LogSchema);
const AtRiskRule = mongoose.model('AtRiskRule', AtRiskRuleSchema);

async function createCollections() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      // MongoDB Atlas connection options
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB successfully!');

    // Get database instance
    const db = mongoose.connection.db;
    
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
      console.log('ℹ️  LogTracker database may already exist or creation failed:', error.message);
    }

    // Create collections if they don't exist
    const collections = ['applications', 'users', 'usergroups', 'logs', 'atriskrules'];
    
    for (const collectionName of collections) {
      try {
        // Check if collection exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          // Create collection
          await db.createCollection(collectionName);
          console.log(`✅ Created collection: ${collectionName}`);
        } else {
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        }
      } catch (error) {
        console.error(`❌ Error creating collection ${collectionName}:`, error.message);
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
    console.error('❌ Error:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed.');
  }
}

// Run the script
createCollections(); 