import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
    server: {
        port: process.env.PORT || 5000,
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/automation-platform',
        username: process.env.MONGO_USERNAME || 'webautomation',
        password: process.env.MONGO_PASSWORD || '123456789'
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        enabled: !!process.env.REDIS_HOST && !!process.env.REDIS_PORT
    },
    browser: {
        wsEndpoint: process.env.BROWSER_WS_ENDPOINT,
        executablePath: process.env.BROWSER_EXECUTABLE_PATH || '/usr/bin/chromium',
        defaultViewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false
        }
    },
    security: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production'
    }
}; 