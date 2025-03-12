# Use Node.js alpine as base image for smaller size
FROM node:18-alpine

# Install necessary build tools
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Copy source code
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Copy environment variables
COPY .env ./

# Install dependencies at runtime
RUN npm run install:all

# Expose ports
EXPOSE 3000 5000

# Start the application
CMD ["npm", "start"] 