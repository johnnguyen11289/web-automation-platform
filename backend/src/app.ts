import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflow.routes';
import browserProfilesRouter from './routes/browserProfiles';
import executionRoutes from './routes/executions';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/workflow', workflowRoutes);
app.use('/api/profile', browserProfilesRouter);
app.use('/api/executions', executionRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 