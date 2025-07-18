# Log Tracker - User Management & Ingestion Services

This project is a **log tracking system** that includes:

A **backend service** built with Node.js + TypeScript for user management and ingestion
A **frontend** using Oracle JET (MVVM + Knockout.js)
Google Directory integration using a **service account key**
Containerized using Docker and Docker Compose
A **log collection system** using mock log generators and Fluent Bit to collect and forward logs to Redis
A **Transport service** (Redis with a Node.js bridge) for buffering and batching logs between collection and ingestion
A **log ingestion service** (Node.js + TypeScript) that pulls log batches from Redis/BullMQ and stores them in MongoDB Atlas

---

## Technologies Used

**Frontend**: Oracle JET, Knockout.js, HTML/CSS
**Backend**: Node.js, TypeScript, Express
**Database**: MongoDB (optional, not included in docker-compose.yml)
**Authentication**: Google Admin SDK (Service Account)
**Containerization**: Docker, Docker Compose
**Log Collection**: Node.js, Python, Bash (simulating log sources) and Fluent Bit
**Log Transport**: Redis, Node.js 
**Ingestion**: Node.js, Typescript

---

## Project Structure

.
├── backend/
│   ├── src/                          # TypeScript source code
│   ├── dist/                         # Compiled JS output
│   ├── credentials/
│   │   └── service-account-key.json  # Google service account key
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/                          # Oracle JET source
│   ├── web/                          # Built output (after `ojet build`)
│   ├── Dockerfile
│   └── package.json
│
├── collection/
│   ├── logs/                        # Collected log files
│   ├── fluent-bit.conf              # Fluent Bit config for log shipping
│   ├── fluentbit.template.conf      # Template for dynamic config
│   ├── generate-conf.sh             # Script to generate config from template
│   ├── mock-application-scripts/    # Scripts to generate mock logs
│   └── README.md
│
├── ingestion/
│   ├── src/                         # TypeScript source for ingestion agent
│   ├── config/                      # Config files for environments
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
│
├── redis-server/
│   ├── redis/                       # Redis config and data
│   ├── bridge/                      # Node.js service to batch logs from Redis to BullMQ
│   ├── docker-compose.yml
│   └── README.md
│
├── docker-compose.yml
├── README.md
└── .env

---

##  Setup Instructions


```bash
git clone https://github.com/hadia-junaid/log-tracker.git
cd log-tracker
git switch feature/dashboard-activity-graph
git pull
```

### Open repo in VS Code

### 1. Environment Variables

Create a .env file inside the backend/ folder based on .env.example:
Populate .env sent offline


Make sure your credentials/service-account-key.json is also present. (also sent offline)

Create another .env in the root directory based on .env.example:
Populate .env sent offline

### 2. Docker Build & Run (Production Mode)

From the root of your project, run:

bash
# Stop any running containers
docker compose down

# Build and run all services
docker compose up --build


Then visit:
Frontend: http://localhost:8000
Backend API: http://localhost:3000

---

### 3. Clean Docker (Optional)

bash
# Stop and remove containers
docker compose down

# Remove images
docker rmi $(docker images -q)

# Clean build cache
docker builder prune -f

---

### 4. Generate sample logs (Optional)

cd collection/mock-application-scripts/stream

./console.sh


OR


cd collection/mock-application-scripts/file

npm i

node generateLogs.js

## 🛠 Notes

The frontend runs a **built Oracle JET app** using http-server
The backend runs the **compiled TypeScript** app from dist/index.js
Make sure not to commit service-account-key.json publicly

---
