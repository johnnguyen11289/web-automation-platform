# Web Automation Platform

A full-stack web automation platform built with modern technologies.

## Tech Stack

- Frontend: React.js
- Backend: Node.js
- Task Queue: BullMQ
- Database: MongoDB

## Project Structure

```
.
├── frontend/         # React.js frontend application
└── backend/         # Node.js backend application
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis (required for BullMQ)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

4. Start the development servers:
   ```bash
   npm start
   ```

This will start both the frontend and backend servers concurrently.

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Features

- Modern React.js frontend with TypeScript
- Node.js backend with Express
- Task queue system using BullMQ
- MongoDB database integration
- RESTful API design 