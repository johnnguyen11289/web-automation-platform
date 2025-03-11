#!/bin/bash

# Start the backend server
cd /app/backend
node dist/index.js &

# Start the frontend server using serve
npx serve -s /app/frontend/build -l 3000

# Keep the container running
wait 