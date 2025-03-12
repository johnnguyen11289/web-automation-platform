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
          // Update task status to running
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { status: 'running' });

          // Execute the task
          await this.executionService.queueExecution(workflowId, profileId);

          // Update task status to completed
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { status: 'completed' });

          return { success: true };
        } catch (error) {
          console.error(`Failed to execute scheduled task ${taskId}:`, error);
          
          // Update task status to failed
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { 
            status: 'failed',
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
    this.worker.on('completed', (job: Job) => {
      if (job) {
        console.log(`Scheduled task ${job.data.taskId} completed successfully`);
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