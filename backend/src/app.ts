import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflow.routes';
import browserProfilesRouter from './routes/browserProfiles';

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/workflow', workflowRoutes);
app.use('/api/profile', browserProfilesRouter);

export default app; 