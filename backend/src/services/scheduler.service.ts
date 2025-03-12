import { Queue, QueueEvents } from 'bullmq';
import { ITask } from '../models/Task';
import mongoose from 'mongoose';
import ExecutionService from './execution.service';

export class TaskSchedulerService {
  private static instance: TaskSchedulerService;
  private taskQueue: Queue;
  private queueEvents: QueueEvents;
  private executionService: ExecutionService;

  private constructor() {
    console.log('Initializing TaskSchedulerService...');
    this.executionService = ExecutionService.getInstance();
    
    // Initialize BullMQ queue
    this.taskQueue = new Queue('scheduled-tasks', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
    console.log('Task queue initialized with Redis connection:', {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379'
    });

    // Initialize queue events (for monitoring)
    this.queueEvents = new QueueEvents('scheduled-tasks', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    // Set up queue event listeners
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`Task job ${jobId} completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Task job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('delayed', ({ jobId, delay }) => {
      console.log(`Task job ${jobId} delayed by ${delay}ms`);
    });

    console.log('TaskSchedulerService initialization complete');
  }

  public static getInstance(): TaskSchedulerService {
    if (!TaskSchedulerService.instance) {
      TaskSchedulerService.instance = new TaskSchedulerService();
    }
    return TaskSchedulerService.instance;
  }

  public async scheduleTask(task: ITask): Promise<void> {
    console.log(`Scheduling task ${task._id}...`);
    
    if (!task.schedule) {
      throw new Error('Task has no schedule configuration');
    }

    const { schedule } = task;
    let nextRun: Date;

    if (!schedule.time) {
      throw new Error('Schedule time is required');
    }

    console.log('Task schedule configuration:', JSON.stringify(schedule, null, 2));

    // If this is a reschedule and the task has run before, use lastRun to calculate next run
    const lastRun = task.lastRun ? new Date(task.lastRun) : null;
    console.log('Last run time:', lastRun?.toISOString() || 'Never run');

    switch (schedule.type) {
      case 'once':
        console.log('Processing one-time schedule...');
        nextRun = new Date(schedule.startDate);
        await this.addToQueue(task, nextRun);
        console.log(`One-time task scheduled for ${nextRun}`);
        break;

      case 'daily':
        console.log('Processing daily schedule...');
        nextRun = lastRun ? 
          this.calculateNextDailyRunFromLast(schedule.time, lastRun) :
          this.calculateNextDailyRun(schedule.time);
        await this.addToQueue(task, nextRun, {
          repeat: {
            pattern: `0 ${schedule.time.split(':')[1]} ${schedule.time.split(':')[0]} * * *`,
          },
        });
        console.log(`Daily task scheduled, next run at ${nextRun}`);
        break;

      case 'weekly':
        if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
          throw new Error('Weekly schedule requires daysOfWeek');
        }
        console.log('Processing weekly schedule...');
        nextRun = lastRun ?
          this.calculateNextWeeklyRunFromLast(schedule.time, schedule.daysOfWeek, lastRun) :
          this.calculateNextWeeklyRun(schedule.time, schedule.daysOfWeek);
        await this.addToQueue(task, nextRun, {
          repeat: {
            pattern: this.createWeeklyCronPattern(schedule.time, schedule.daysOfWeek),
          },
        });
        console.log(`Weekly task scheduled, next run at ${nextRun}`);
        break;

      case 'monthly':
        if (!schedule.daysOfMonth || schedule.daysOfMonth.length === 0) {
          throw new Error('Monthly schedule requires daysOfMonth');
        }
        console.log('Processing monthly schedule...');
        nextRun = lastRun ?
          this.calculateNextMonthlyRunFromLast(schedule.time, schedule.daysOfMonth, lastRun) :
          this.calculateNextMonthlyRun(schedule.time, schedule.daysOfMonth);
        await this.addToQueue(task, nextRun, {
          repeat: {
            pattern: this.createMonthlyCronPattern(schedule.time, schedule.daysOfMonth),
          },
        });
        console.log(`Monthly task scheduled, next run at ${nextRun}`);
        break;
    }

    console.log(`Updating task ${task._id} with next run time ${nextRun}`);
    // Update task's nextRun in database
    await mongoose.model<ITask>('Task').findByIdAndUpdate(task._id, { nextRun });
    console.log(`Task ${task._id} scheduling complete`);
  }

  private async addToQueue(task: ITask, nextRun: Date, options: any = {}): Promise<void> {
    const jobId = `task:${task._id}`;
    const delay = Math.max(0, nextRun.getTime() - Date.now());

    console.log('Adding task to queue:', {
      jobId,
      nextRun: nextRun.toISOString(),
      delay,
      options
    });

    try {
      const job = await this.taskQueue.add(
        'execute-task',
        {
          taskId: task._id,
          workflowId: task.workflowId,
          profileId: task.profileId,
        },
        {
          jobId,
          delay,
          ...options,
        }
      );

      console.log(`Task added to queue successfully, job ID: ${job.id}`);
    } catch (error) {
      console.error('Error adding task to queue:', error);
      throw error;
    }
  }

  private calculateNextDailyRun(time: string): Date {
    console.log('Calculating next daily run for time:', time);
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    console.log('Next daily run calculated:', next.toISOString());
    return next;
  }

  private calculateNextDailyRunFromLast(time: string, lastRun: Date): Date {
    console.log('Calculating next daily run from last run:', { time, lastRun: lastRun.toISOString() });
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(lastRun);
    next.setDate(next.getDate() + 1);
    next.setHours(hours, minutes, 0, 0);
    
    // If the calculated time is still in the past, add another day
    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }
    
    console.log('Next daily run calculated from last run:', next.toISOString());
    return next;
  }

  private calculateNextWeeklyRun(time: string, daysOfWeek: number[]): Date {
    console.log('Calculating next weekly run:', { time, daysOfWeek });
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDay();
    
    // Sort days to ensure we find the next occurrence
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    
    // Find the next day of week
    const nextDay = sortedDays.find(day => day > currentDay) ?? sortedDays[0];
    const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
    
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysToAdd,
      hours,
      minutes
    );
    
    console.log('Next weekly run calculated:', next.toISOString());
    return next;
  }

  private calculateNextWeeklyRunFromLast(time: string, daysOfWeek: number[], lastRun: Date): Date {
    console.log('Calculating next weekly run from last run:', { time, daysOfWeek, lastRun: lastRun.toISOString() });
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(lastRun);
    
    // Sort days to ensure we find the next occurrence
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    
    // Find the next day of week after the last run
    const lastRunDay = lastRun.getDay();
    const nextDay = sortedDays.find(day => day > lastRunDay) ?? sortedDays[0];
    const daysToAdd = nextDay > lastRunDay ? nextDay - lastRunDay : 7 - lastRunDay + nextDay;
    
    next.setDate(next.getDate() + daysToAdd);
    next.setHours(hours, minutes, 0, 0);
    
    // If the calculated time is still in the past, find the next occurrence
    if (next <= now) {
      const currentDay = now.getDay();
      const nextFutureDay = sortedDays.find(day => day > currentDay) ?? sortedDays[0];
      const daysToAddFromNow = nextFutureDay > currentDay ? 
        nextFutureDay - currentDay : 
        7 - currentDay + nextFutureDay;
      
      next.setDate(now.getDate() + daysToAddFromNow);
      next.setHours(hours, minutes, 0, 0);
    }
    
    console.log('Next weekly run calculated from last run:', next.toISOString());
    return next;
  }

  private calculateNextMonthlyRun(time: string, daysOfMonth: number[]): Date {
    console.log('Calculating next monthly run:', { time, daysOfMonth });
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDate();
    
    // Sort days to ensure we find the next occurrence
    const sortedDays = [...daysOfMonth].sort((a, b) => a - b);
    
    // Find the next day of month
    const nextDay = sortedDays.find(day => day > currentDay) ?? sortedDays[0];
    const next = new Date(
      now.getFullYear(),
      now.getMonth() + (nextDay <= currentDay ? 1 : 0),
      nextDay,
      hours,
      minutes
    );
    
    console.log('Next monthly run calculated:', next.toISOString());
    return next;
  }

  private calculateNextMonthlyRunFromLast(time: string, daysOfMonth: number[], lastRun: Date): Date {
    console.log('Calculating next monthly run from last run:', { time, daysOfMonth, lastRun: lastRun.toISOString() });
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(lastRun);
    
    // Sort days to ensure we find the next occurrence
    const sortedDays = [...daysOfMonth].sort((a, b) => a - b);
    
    // Move to next month
    next.setMonth(next.getMonth() + 1);
    
    // Find the next valid day in the new month
    const nextDay = sortedDays[0]; // Start with the first allowed day
    next.setDate(nextDay);
    next.setHours(hours, minutes, 0, 0);
    
    // If the calculated time is still in the past, move to the next month
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(nextDay);
      next.setHours(hours, minutes, 0, 0);
    }
    
    console.log('Next monthly run calculated from last run:', next.toISOString());
    return next;
  }

  private createWeeklyCronPattern(time: string, daysOfWeek: number[]): string {
    const [hours, minutes] = time.split(':').map(Number);
    const pattern = `0 ${minutes} ${hours} * * ${daysOfWeek.join(',')}`;
    console.log('Created weekly cron pattern:', pattern);
    return pattern;
  }

  private createMonthlyCronPattern(time: string, daysOfMonth: number[]): string {
    const [hours, minutes] = time.split(':').map(Number);
    const pattern = `0 ${minutes} ${hours} ${daysOfMonth.join(',')} * *`;
    console.log('Created monthly cron pattern:', pattern);
    return pattern;
  }

  public async removeScheduledTask(taskId: string): Promise<void> {
    console.log(`Removing scheduled task ${taskId} from queue...`);
    
    try {
      // Remove the job and its repeat configuration if it exists
      const jobId = `task:${taskId}`;
      const job = await this.taskQueue.getJob(jobId);
      
      if (job) {
        // Remove the job
        await job.remove();
        console.log(`Job ${jobId} removed from queue`);

        // If it's a repeatable job, remove the repeat configuration
        const repeatableJobs = await this.taskQueue.getRepeatableJobs();
        const matchingRepeatJobs = repeatableJobs.filter(repeatJob => repeatJob.key && repeatJob.key.startsWith(`task:${taskId}`));
        
        for (const repeatJob of matchingRepeatJobs) {
          await this.taskQueue.removeRepeatableByKey(repeatJob.key);
          console.log(`Removed repeatable job configuration for ${repeatJob.key}`);
        }
      } else {
        console.log(`No job found with ID ${jobId}`);
      }
    } catch (error) {
      console.error('Error removing scheduled task:', error);
      throw error;
    }
  }
} 