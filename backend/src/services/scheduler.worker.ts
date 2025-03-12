import { Worker, Job } from 'bullmq';
import { ITask } from '../models/Task';
import mongoose from 'mongoose';
import ExecutionService from './execution.service';

export class SchedulerWorker {
  private static instance: SchedulerWorker;
  private worker: Worker;
  private executionService: ExecutionService;

  private constructor() {
    this.executionService = ExecutionService.getInstance();

    this.worker = new Worker(
      'scheduled-tasks',
      async (job: Job) => {
        const { taskId, workflowId, profileId } = job.data;

        try {
          // Update task status to running and set lastRun
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { 
            status: 'running',
            lastRun: new Date()
          });

          // Execute the task
          await this.executionService.queueExecution(workflowId, profileId);

          // Update task status to completed and ensure lastRun is set
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { 
            status: 'completed',
            lastRun: new Date()
          });

          return { success: true };
        } catch (error) {
          console.error(`Failed to execute scheduled task ${taskId}:`, error);
          
          // Update task status to failed but still record the attempt time
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { 
            status: 'failed',
            lastRun: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          throw error;
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: 5, // Process up to 5 tasks simultaneously
      }
    );

    // Handle worker events
    this.worker.on('completed', async (job: Job) => {
      if (job) {
        console.log(`Scheduled task ${job.data.taskId} completed successfully`);
        
        // Update lastRun time in case it wasn't set during execution
        try {
          const task = await mongoose.model<ITask>('Task').findById(job.data.taskId);
          if (task && !task.lastRun) {
            task.lastRun = new Date();
            await task.save();
          }
        } catch (error) {
          console.error(`Error updating lastRun for task ${job.data.taskId}:`, error);
        }
      }
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      if (job) {
        console.error(`Scheduled task ${job.data.taskId} failed:`, error);
      }
    });
  }

  public static getInstance(): SchedulerWorker {
    if (!SchedulerWorker.instance) {
      SchedulerWorker.instance = new SchedulerWorker();
    }
    return SchedulerWorker.instance;
  }

  public async close(): Promise<void> {
    await this.worker.close();
  }
} 