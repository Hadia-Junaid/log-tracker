# Log Tracker Backend

This is the backend service for the Log Tracker application, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

## Setup Instructions

### 1. Install Dependencies

Navigate to the backend directory and install the required dependencies:

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/LogTracker

# Other environment variables
NODE_ENV=development
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- The `.env` file is already added to `.gitignore`
- Replace the MongoDB URI with your actual connection string

### 3. MongoDB Setup

#### Local MongoDB

1. **Install MongoDB Community Edition**
   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB Service**
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

3. **Use Local Connection String**
   ```env
   MONGODB_URI=mongodb://localhost:27017/LogTracker
   ```

### 4. Initialize Database Collections

You can run the database initialization script:

```bash
npm run create-collections:ts
```


This script will:
- Connect to your MongoDB instance
- Create the `LogTracker` database
- Create all required collections:
  - `applications` - Stores application information
  - `users` - Stores user data and preferences
  - `usergroups` - Stores user groups and permissions
  - `logs` - Stores application logs
  - `atriskrules` - Stores risk assessment rules
- Create appropriate indexes for better performance

### 5. Verify Setup

After running the initialization script, you should see output similar to:

```
Connecting to MongoDB...
Connected to MongoDB successfully!
Creating LogTracker database...
✅ LogTracker database created successfully!
✅ Created collection: applications
✅ Created collection: users
✅ Created collection: usergroups
✅ Created collection: logs
✅ Created collection: atriskrules
Creating indexes...
✅ Created indexes for Application collection
✅ Created indexes for User collection
✅ Created indexes for UserGroup collection
✅ Created indexes for Log collection
✅ Created indexes for AtRiskRule collection
🎉 All collections and indexes created successfully!
```
