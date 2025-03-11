# Build stage for Frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build stage for Backend
FROM node:18 AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Final stage
FROM node:18-slim
WORKDIR /app

# Install Chrome dependencies and Playwright browsers
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-symbola \
    fonts-noto \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Copy built backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package*.json ./backend/

# Install backend production dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy necessary files
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV BROWSER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose ports
EXPOSE 5000
EXPOSE 3000

# Start the application
ENTRYPOINT ["/docker-entrypoint.sh"] 