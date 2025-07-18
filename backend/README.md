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
- Please refer to .env.example file.

### 3a. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/auth/google/callback`
6. Copy the Client ID and Client Secret to your .env file

---

### 4. Run the Project

Run locally with Node.js:
- "npm run dev"

Run with Docker
Ensure Docker is installed, then run from the project's root directory:

- "docker-compose up --build"

This will:

Start the backend on http://localhost:3000

### 5. Logging

All logging is done through Winston. To enable only production level logs, set the NODE_ENV variable in the .env file to "production". This is already done when you run it through Docker.

For developers, import the logger utility with:
- "import logger from './utils/logger';"

Then use it for different log levels including error, warn, info, and debug.

---