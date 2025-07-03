# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
COPY credentials/service-account-key.json ./credentials/service-account-key.json
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output and other necessary files from builder
COPY --from=builder /app/credentials /app/credentials
COPY --from=builder /app/dist ./dist
COPY config ./config

# Start the app using compiled JS
CMD ["node", "dist/index.js"]
