import { Queue, QueueEvents } from 'bullmq';
import { ITask } from '../models/Task';
import mongoose, { Types } from 'mongoose';
import ExecutionService from './execution.service';

export class TaskSchedulerService {
  private static instance: TaskSchedulerService;
  private taskQueue: Queue;
  private queueEvents: QueueEvents;
  private executionService: ExecutionService;

  private constructor() {
    this.executionService = ExecutionService.getInstance();
    
    this.taskQueue = new Queue('scheduled-tasks', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.queueEvents = new QueueEvents('scheduled-tasks', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
  }

  public static getInstance(): TaskSchedulerService {
    if (!TaskSchedulerService.instance) {
      TaskSchedulerService.instance = new TaskSchedulerService();
    }
    return TaskSchedulerService.instance;
  }

  public async scheduleTask(task: ITask): Promise<void> {
    if (!task.schedule) {
      throw new Error('Task has no schedule configuration');
    }

    const { schedule } = task;
    let nextRun: Date;

    const lastRun = task.lastRun ? new Date(task.lastRun) : null;

    switch (schedule.type) {
      case 'once':
        nextRun = new Date(schedule.startDate);
        await this.addToQueue(task, nextRun);
        break;

      case 'every':
        if (schedule.interval < 1) {
          throw new Error('Interval must be at least 1 hour for "every" schedule type');
        }
        nextRun = lastRun ? 
          this.calculateNextIntervalRunFromLast(schedule.interval, lastRun) :
          this.calculateNextIntervalRun(schedule.interval, schedule.startDate);
        await this.addToQueue(task, nextRun, {
          repeat: {
            every: schedule.interval * 60 * 60 * 1000, // Convert hours to milliseconds
            startDate: schedule.startDate,
            endDate: schedule.endDate
          }
        });
        break;

      case 'daily':
        if (!schedule.time) {
          throw new Error('Time is required for daily schedule');
        }
        nextRun = lastRun ? 
          this.calculateNextDailyRunFromLast(schedule.time, lastRun) :
          this.calculateNextDailyRun(schedule.time);
        await this.addToQueue(task, nextRun, {
          repeat: {
            pattern: `0 ${schedule.time.split(':')[1]} ${schedule.time.split(':')[0]} * * *`,
          },
        });
        break;

      case 'weekly':
        if (schedule.daysOfWeek.length === 0) {
          throw new Error('Weekly schedule requires daysOfWeek');
        }
        nextRun = lastRun ?
          this.calculateNextWeeklyRunFromLast(schedule.time, schedule.daysOfWeek, lastRun) :
          this.calculateNextWeeklyRun(schedule.time, schedule.daysOfWeek);
        await this.addToQueue(task, nextRun, {
          repeat: {
            pattern: this.createWeeklyCronPattern(schedule.time, schedule.daysOfWeek),
          },
        });
        break;

      case 'monthly':
        if (schedule.daysOfMonth.length === 0) {
          throw new Error('Monthly schedule requires daysOfMonth');
        }
        nextRun = lastRun ?
          this.calculateNextMonthlyRunFromLast(schedule.time, schedule.daysOfMonth, lastRun) :
          this.calculateNextMonthlyRun(schedule.time, schedule.daysOfMonth);
        await this.addToQueue(task, nextRun, {
          repeat: {
            pattern: this.createMonthlyCronPattern(schedule.time, schedule.daysOfMonth),
          },
        });
        break;
    }

    await mongoose.model<ITask>('Task').findByIdAndUpdate(task._id, { nextRun });
  }

  private async addToQueue(task: ITask, nextRun: Date, options: any = {}): Promise<void> {
    const jobId = `task:${task._id}`;
    const delay = Math.max(0, nextRun.getTime() - Date.now());

    await this.taskQueue.add(
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
  }

  private calculateNextDailyRun(time: string): Date {
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
    
    return next;
  }

  private calculateNextDailyRunFromLast(time: string, lastRun: Date): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(lastRun);
    next.setDate(next.getDate() + 1);
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }

  private calculateNextWeeklyRun(time: string, daysOfWeek: number[]): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDay();
    
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    const nextDay = sortedDays.find(day => day > currentDay) ?? sortedDays[0];
    const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
    
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysToAdd,
      hours,
      minutes
    );
    
    return next;
  }

  private calculateNextWeeklyRunFromLast(time: string, daysOfWeek: number[], lastRun: Date): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(lastRun);
    
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    const lastRunDay = lastRun.getDay();
    const nextDay = sortedDays.find(day => day > lastRunDay) ?? sortedDays[0];
    const daysToAdd = nextDay > lastRunDay ? nextDay - lastRunDay : 7 - lastRunDay + nextDay;
    
    next.setDate(next.getDate() + daysToAdd);
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      const currentDay = now.getDay();
      const nextFutureDay = sortedDays.find(day => day > currentDay) ?? sortedDays[0];
      const daysToAddFromNow = nextFutureDay > currentDay ? 
        nextFutureDay - currentDay : 
        7 - currentDay + nextFutureDay;
      
      next.setDate(now.getDate() + daysToAddFromNow);
      next.setHours(hours, minutes, 0, 0);
    }
    
    return next;
  }

  private calculateNextMonthlyRun(time: string, daysOfMonth: number[]): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDate();
    
    const sortedDays = [...daysOfMonth].sort((a, b) => a - b);
    const nextDay = sortedDays.find(day => day > currentDay) ?? sortedDays[0];
    const next = new Date(
      now.getFullYear(),
      now.getMonth() + (nextDay <= currentDay ? 1 : 0),
      nextDay,
      hours,
      minutes
    );
    
    return next;
  }

  private calculateNextMonthlyRunFromLast(time: string, daysOfMonth: number[], lastRun: Date): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(lastRun);
    
    const sortedDays = [...daysOfMonth].sort((a, b) => a - b);
    next.setMonth(next.getMonth() + 1);
    
    const nextDay = sortedDays[0];
    next.setDate(nextDay);
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(nextDay);
      next.setHours(hours, minutes, 0, 0);
    }
    
    return next;
  }

  private createWeeklyCronPattern(time: string, daysOfWeek: number[]): string {
    const [hours, minutes] = time.split(':').map(Number);
    return `0 ${minutes} ${hours} * * ${daysOfWeek.join(',')}`;
  }

  private createMonthlyCronPattern(time: string, daysOfMonth: number[]): string {
    const [hours, minutes] = time.split(':').map(Number);
    return `0 ${minutes} ${hours} ${daysOfMonth.join(',')} * *`;
  }

  private calculateNextIntervalRun(intervalHours: number, startDate: Date): Date {
    const now = new Date();
    const start = new Date(startDate);
    
    if (start > now) {
      return start;
    }
    
    const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
    const intervalsSinceStart = Math.floor(hoursSinceStart / intervalHours);
    const nextRun = new Date(start);
    nextRun.setHours(nextRun.getHours() + (intervalsSinceStart + 1) * intervalHours);
    
    return nextRun;
  }

  private calculateNextIntervalRunFromLast(intervalHours: number, lastRun: Date): Date {
    const nextRun = new Date(lastRun);
    nextRun.setHours(nextRun.getHours() + intervalHours);
    
    if (nextRun <= new Date()) {
      const now = new Date();
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      const intervalsSinceLastRun = Math.floor(hoursSinceLastRun / intervalHours);
      nextRun.setHours(lastRun.getHours() + (intervalsSinceLastRun + 1) * intervalHours);
    }
    
    return nextRun;
  }

  public async rescheduleTask(task: ITask): Promise<void> {
    // Remove existing schedule
    await this.removeScheduledTask((task._id as Types.ObjectId).toString());
    
    // Reschedule the task
    await this.scheduleTask(task);
  }

  public async handleTaskCompletion(task: ITask): Promise<void> {
    if (task.schedule.type === 'once') {
      // For one-time tasks, update status to completed
      await mongoose.model<ITask>('Task').findByIdAndUpdate((task._id as Types.ObjectId).toString(), {
        status: 'completed',
        lastRun: new Date(),
        nextRun: null
      });
    } else {
      // For recurring tasks, update last run and schedule next run
      await mongoose.model<ITask>('Task').findByIdAndUpdate((task._id as Types.ObjectId).toString(), {
        lastRun: new Date(),
        status: 'scheduled'
      });
      await this.scheduleTask(task);
    }
  }

  public async handleTaskFailure(task: ITask, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const retries = (task as any).retryCount || 0;
    const maxRetries = task.maxRetries || 3;

    if (retries < maxRetries) {
      // Retry the task
      const nextRetry = new Date();
      nextRetry.setMinutes(nextRetry.getMinutes() + Math.pow(2, retries)); // Exponential backoff
      
      await mongoose.model<ITask>('Task').findByIdAndUpdate((task._id as Types.ObjectId).toString(), {
        status: 'pending',
        retryCount: retries + 1,
        nextRun: nextRetry,
        errorLogs: [...(task.errorLogs || []), `Retry ${retries + 1}/${maxRetries}: ${errorMessage}`]
      });

      await this.addToQueue(task, nextRetry);
    } else {
      // Mark task as failed after max retries
      await mongoose.model<ITask>('Task').findByIdAndUpdate((task._id as Types.ObjectId).toString(), {
        status: 'failed',
        errorLogs: [...(task.errorLogs || []), `Failed after ${maxRetries} retries: ${errorMessage}`]
      });

      if (task.schedule.type !== 'once') {
        // For recurring tasks, schedule next run
        await this.scheduleTask(task);
      }
    }
  }

  public async removeScheduledTask(taskId: string): Promise<void> {
    const jobId = `task:${taskId}`;
    const job = await this.taskQueue.getJob(jobId);
    
    if (job) {
      await job.remove();
      const repeatableJobs = await this.taskQueue.getRepeatableJobs();
      const matchingRepeatJobs = repeatableJobs.filter(repeatJob => repeatJob.key && repeatJob.key.startsWith(`task:${taskId}`));
      
      for (const repeatJob of matchingRepeatJobs) {
        await this.taskQueue.removeRepeatableByKey(repeatJob.key);
      }
    }
  }

  public async getTaskScheduleStatus(taskId: string): Promise<{
    isScheduled: boolean;
    nextRun: Date | null;
    lastRun: Date | null;
    status: string;
  }> {
    const jobId = `task:${taskId}`;
    const job = await this.taskQueue.getJob(jobId);
    const task = await mongoose.model<ITask>('Task').findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    return {
      isScheduled: !!job,
      nextRun: task.nextRun || null,
      lastRun: task.lastRun || null,
      status: task.status
    };
  }
} 