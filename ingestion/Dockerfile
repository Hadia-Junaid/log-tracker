# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist
COPY config ./config

ENV NODE_ENV=production


# Start the app
CMD ["node", "dist/index.js"]
