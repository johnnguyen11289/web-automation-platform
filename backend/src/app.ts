import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflow.routes';

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/workflow', workflowRoutes);

export default app; 