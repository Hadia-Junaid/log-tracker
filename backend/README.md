# LogTracker Backend

This is the backend for **LogTracker**, a logging microservice project built with:

- Node.js
- Express
- TypeScript
- MongoDB Atlas
- Docker

## Features

- RESTful API using Express
- MongoDB Atlas integration via Mongoose
- Environment-based configuration
- Dockerized for development

---

## Tech Stack

- **Backend:** Node.js, Express
- **Language:** TypeScript
- **Database:** MongoDB Atlas
- **ORM:** Mongoose
- **Dev Tools:** ts-node-dev, dotenv, Docker, docker-compose

---

## Project Structure

Backend/
├── src/
│ └── index.ts              # Entry point
├── .env                    # Environment variables
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
" npm install express mongoose dotenv "

- Development dependencies
" npm install -D typescript ts-node-dev @types/express @types/node @types/mongoose "

---

### 3. Create .env file
In the root folder, create a .env file:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
PORT=3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-here
```

Replace the following with actual values:
- `<username>`, `<password>`, `<cluster>`, and `<dbname>` with your MongoDB Atlas cluster details
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console
- `JWT_SECRET` with a strong secret key for JWT token signing

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
Ensure Docker is installed, then run:

- "docker-compose up --build"

This will:

Start the backend on http://localhost:3000

### 5 . Logging

All logging is done through Winston. To enable only production level logs, set the NODE_ENV variable in the .env file to "production".

For developers, import the logger utility with:
- "import logger from './utils/logger';"

Then use it for different log levels including error, warn, info, and debug. 

---

## API Endpoints

### Authentication

#### Google OAuth Login
- **GET** `/auth/google`
- **Description:** Initiate Google OAuth login flow
- **Response:** Returns Google OAuth authorization URL

#### Google OAuth Callback  
- **GET** `/auth/google/callback?code={authorization_code}`
- **Description:** Handle Google OAuth callback and authenticate user
- **Parameters:** 
  - `code`: Authorization code from Google OAuth
- **Response:** JWT token and user information (if user exists in database)
- **Error:** 403 if user not found in database with message "Access denied. Please contact your administrator."

#### Verify Token
- **GET** `/auth/verify`
- **Description:** Verify JWT token and return user information
- **Headers:** `Authorization: Bearer {jwt_token}`
- **Response:** User information if token is valid

#### Logout
- **POST** `/auth/logout`
- **Description:** Logout user (invalidate session)
- **Response:** Success message

### Protected Routes

To protect any route, use the authentication middleware:

```typescript
import { authenticate } from './middleware/auth';

// Protected route example
app.get('/protected-route', authenticate, (req, res) => {
  // req.user contains authenticated user information
  res.json({ user: req.user });
});
```

---