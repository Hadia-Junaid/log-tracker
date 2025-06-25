# LogTracker Backend

This is the backend for **LogTracker**, a logging microservice project built with:

- Node.js
- Express
- TypeScript
- MongoDB Atlas
- Docker
- Google Admin SDK

## Features

- RESTful API using Express
- MongoDB Atlas integration via Mongoose
- Environment-based configuration using the `config` package
- Google Admin SDK integration for user management
- Dockerized for development

---

## Tech Stack

- **Backend:** Node.js, Express
- **Language:** TypeScript
- **Database:** MongoDB Atlas
- **ORM:** Mongoose
- **Configuration:** config package
- **Google APIs:** googleapis, google-auth-library
- **Dev Tools:** ts-node-dev, dotenv, Docker, docker-compose

---

## Project Structure

Backend/
├── src/
│   ├── controllers/
│   │   └── adminController.ts    # Google Admin SDK controllers
│   ├── routes/
│   │   └── adminRoutes.ts        # Admin API routes
│   ├── utils/
│   │   └── googleAdminSDK.ts     # Google Admin SDK utilities
│   └── index.ts                  # Entry point
├── config/
│   ├── default.json              # Default configuration
│   ├── custom-environment-variables.json  # Environment variable mappings
│   ├── development.json          # Development-specific config
│   └── production.json           # Production-specific config
├── .env                          # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/logtracker-backend.git
cd logtracker-backend

```

### 2. Install Required Dependencies

- Runtime dependencies
" npm install express mongoose dotenv config googleapis google-auth-library "

- Development dependencies
" npm install -D typescript ts-node-dev @types/express @types/node @types/mongoose "

---

### 3. Configuration Setup

The project uses the `config` package for configuration management. Create environment variables for the following:

#### Required Environment Variables:

```bash
# MongoDB Configuration
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Google Admin SDK Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/your/service-account-key.json
GOOGLE_ADMIN_IMPERSONATION_EMAIL=admin@yourdomain.com
GOOGLE_ADMIN_SCOPES=https://www.googleapis.com/auth/admin.directory.user,https://www.googleapis.com/auth/admin.directory.group.member
```

#### Google Admin SDK Setup:

1. Create a Google Cloud Project
2. Enable the Admin SDK Directory API
3. Create a Service Account with Domain-Wide Delegation
4. Download the service account key JSON file
5. Configure the service account with the required scopes in your Google Workspace Admin Console

---

### 4. Run the Project

Run locally with Node.js:
- "npm run dev"

Run with Docker
Ensure Docker is installed, then run:

- "docker-compose up --build"

This will:

Start the backend on http://localhost:3000

### 5. API Endpoints

#### Admin Routes (`/api/admin`):

- `GET /api/admin/users/search?searchString=<query>` - Search users in Google Directory
- `PATCH /api/admin/users/assign-group` - Add user to group and local database

### 6. Logging

All logging is done through Winston. To enable only production level logs, set the NODE_ENV variable in the .env file to "production".

For developers, import the logger utility with:
- "import logger from './utils/logger';"

Then use it for different log levels including error, warn, info, and debug.

---