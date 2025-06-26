# Using Node.js 24 Alpine image
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Source Code
COPY . .

# Expose the port the app runs on
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host"]