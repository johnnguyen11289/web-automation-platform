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
          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { 
            status: 'running',
            lastRun: new Date()
          });

          await this.executionService.queueExecution(workflowId, profileId);

          await mongoose.model<ITask>('Task').findByIdAndUpdate(taskId, { 
            status: 'completed',
            lastRun: new Date()
          });

          return { success: true };
        } catch (error) {
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
        concurrency: 5,
      }
    );

    this.worker.on('completed', async (job: Job) => {
      if (job) {
        try {
          const task = await mongoose.model<ITask>('Task').findById(job.data.taskId);
          if (task && !task.lastRun) {
            task.lastRun = new Date();
            await task.save();
          }
        } catch (error) {
          // Ignore error as this is just a backup update
        }
      }
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      if (job) {
        // Log failed task
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