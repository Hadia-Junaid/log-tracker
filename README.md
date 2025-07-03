# Log Tracker - User Management & Ingestion Services

This project is a **log tracking system** that includes:

A **backend service** built with Node.js + TypeScript for user management and ingestion
A **frontend** using Oracle JET (MVVM + Knockout.js)
Google Directory integration using a **service account key**
Containerized using Docker and Docker Compose

---

## Technologies Used

**Frontend**: Oracle JET, Knockout.js, HTML/CSS
**Backend**: Node.js, TypeScript, Express
**Database**: MongoDB (optional, not included in docker-compose.yml)
**Authentication**: Google Admin SDK (Service Account)
**Containerization**: Docker, Docker Compose

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
├── docker-compose.yml
└── README.md

---

##  Setup Instructions


```bash
git clone https://github.com/hadia-junaid/log-tracker.git
cd log-tracker
git switch develop
git pull
```

### Open repo in VS Code

### 1. Environment Variables

Create a .env file inside the backend/ folder based on .env.example:
Populate .env sent offline


Make sure your credentials/service-account-key.json is also present. (also sent offline)


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

## 🛠 Notes

The frontend runs a **built Oracle JET app** using http-server
The backend runs the **compiled TypeScript** app from dist/index.js
Make sure not to commit service-account-key.json publicly

---

## Contact

For questions or collaboration, feel free to reach out @ bilal.salman@gosaas.io