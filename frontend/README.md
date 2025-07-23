# Log Tracker Frontend

This is the frontend for the Log Tracker application, built with [Oracle JET](https://www.oracle.com/webfolder/technetwork/jet/index.html), [Preact](https://preactjs.com/), [Chart.js](https://www.chartjs.org/), and [TailwindCSS](https://tailwindcss.com/). It provides a modern, responsive UI for tracking and visualizing logs.

## Tech Stack
- **Oracle JET**: UI components and application framework
- **Preact**: Fast, lightweight React alternative
- **Chart.js**: Data visualization
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Typed JavaScript
- **Webpack**: Module bundler


## Project Structure

```
frontend/
├── src/                # Main source code (components, views, services, styles, etc.)
├── web/                # Build output (static files served in production)
├── staged-themes/      # Staged Oracle JET themes
├── types/              # Custom TypeScript type definitions
├── scripts/            # Utility scripts
├── oraclejetconfig.json# Oracle JET configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project metadata and dependencies
├── Dockerfile          # Docker build instructions
├── nginx.conf          # Nginx config for SPA routing
```

## Getting Started

### Prerequisites
- Node.js >= 16.x
- npm >= 8.x

### Install Dependencies
```bash
npm install
```

### Run the App in Development
```bash
npx ojet serve
```
This will start a local development server and open the app in your default browser at (http://localhost:8080).



