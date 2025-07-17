# Stage 1: Build the OJET app
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies including dev
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the OJET app (outputs to ./web by default)
RUN npx ojet build

# Stage 2: Serve using nginx
FROM nginx:alpine

# Copy built OJET app from builder
COPY --from=builder /app/web /usr/share/nginx/html

# Replace default nginx config with our SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

