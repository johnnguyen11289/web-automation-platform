import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import workflowRoutes from './routes/workflow.routes';
import browserProfileRoutes from './routes/browserProfiles';
import executionRoutes from './routes/executions';
import taskRoutes from './routes/tasks';
import recordingRoutes from './routes/recording.routes';
import { config } from './config/config';

const app = express();

// Middleware
app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/browser-profiles', browserProfileRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/recording', recordingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: config.server.nodeEnv,
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 