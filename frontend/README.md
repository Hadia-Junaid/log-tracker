# Frontend (Dev) – Log Tracker UI

This folder is the **frontend** for the Log Tracker platform, built with **React + TypeScript + Vite** and styled using **Redwood UI** components.

This guide helps you **build and run the frontend inside a Docker container** with hot-reload for development.

---

## Requirements

- [Docker](https://www.docker.com/) installed and running
- Your frontend code must be in a directory named `frontend/`
- `package.json` should contain a `dev` script, like:
  ```json
  "scripts": {
    "dev": "vite"
  }

  ```

---

## Running the Frontend in a Container

- Navigate to the frontend directory
  `cd frontend`
- Build the container
  `docker build -f Dockerfile.dev -t log-frontend .`
- Run the container
  `docker run -p 5173:5173 log-frontend`
