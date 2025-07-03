# Stage 1: Build the OJET app
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies including dev
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the OJET app (outputs to ./web by default)
RUN npm run build

# Stage 2: Lightweight production server
FROM node:20-alpine

WORKDIR /app

# Install only a static file server
RUN npm install -g http-server

# Copy built OJET app from builder
COPY --from=builder /app/web ./web

# Expose OJET port
EXPOSE 8000

# Serve using http-server
CMD ["http-server", "web", "-p", "8000"]
