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

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
PORT=3000

'''Replace <username>, <password>, <cluster>, and <dbname> with actual values from your MongoDB Atlas cluster.

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