import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Queue, Worker } from 'bullmq';
import { AutomationService } from './services/automation.service';
import { TaskSchedulerService } from './services/scheduler.service';
import { SchedulerWorker } from './services/scheduler.worker';
import { connectDB } from './config/database';
import app from './app';
import Redis from 'ioredis';
import { Task, AutomationTask } from './types/task';

// Load environment variables
dotenv.config();

const PORT = process.env.BACKEND_PORT || 5000;
const automationService = AutomationService.getInstance();
const taskSchedulerService = TaskSchedulerService.getInstance();
const schedulerWorker = SchedulerWorker.getInstance();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize BullMQ queue and worker (optional)
let taskQueue: Queue<Task> | null = null;
let worker: Worker | null = null;

// Initialize task queue with Redis connection
async function initializeTaskQueue(connection: { host: string; port: number }) {
  taskQueue = new Queue('tasks', { connection });

  worker = new Worker('tasks', async (job) => {
    console.log(`Processing automation job ${job.id}`);
    const { url, actions } = job.data as AutomationTask;
    
    try {
      const result = await automationService.performWebAutomation(url, actions);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  }, { connection });

  console.log('Task queue initialized');
}

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Initialize task queue if Redis is available
    if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
      try {
        const connection = {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        };
        
        // Test Redis connection
        const redis = new Redis(connection);
        await redis.ping();
        await redis.quit();
        
        console.log('Redis connection successful - initializing task queue');
        await initializeTaskQueue(connection);
      } catch (error) {
        const err = error as Error;
        console.error('Redis connection failed:', err.message);
        console.warn('Running without task queue');
      }
    } else {
      console.warn('REDIS_HOST or REDIS_PORT not provided - running without task queue');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// API Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Web Automation Platform API',
    status: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      taskScheduler: 'running',
      schedulerWorker: 'running'
    }
  });
});

// Submit automation task
app.post('/api/automation', async (req: Request, res: Response) => {
  try {
    const { url, actions } = req.body;
    
    // Validate input
    if (!url || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Invalid input. URL and actions array required.' });
    }

    if (taskQueue) {
      // Add job to queue if available
      const job = await taskQueue.add('automation', { url, actions });
      res.json({
        message: 'Automation task queued successfully',
        jobId: job.id,
      });
    } else {
      // Execute immediately if no queue is available
      const result = await automationService.performWebAutomation(url, actions);
      res.json({
        message: 'Automation task completed',
        result,
      });
    }
  } catch (error) {
    console.error('Error processing automation task:', error);
    res.status(500).json({ error: 'Failed to process automation task' });
  }
});

// Get job status
app.get('/api/automation/:jobId', async (req: Request, res: Response) => {
  try {
    if (!taskQueue) {
      return res.status(404).json({ error: 'Task queue not available' });
    }

    const job = await taskQueue.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const result = job.returnvalue;

    res.json({
      jobId: job.id,
      state,
      result,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  await automationService.close();
  await schedulerWorker.close();
  if (worker) await worker.close();
  if (taskQueue) await taskQueue.close();
  process.exit(0);
});

// Start the server
startServer(); 