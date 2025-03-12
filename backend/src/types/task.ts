import { Document } from 'mongoose';
import { TaskStatus, TaskPriority, TaskScheduleType } from './task.types';

export type AutomationActionType = 'wait' | 'click' | 'type' | 'screenshot' | 'extract' | 'evaluate' | 'keyboard' | 'select' | 'focus' | 'hover' | 'openUrl';

export interface AutomationAction {
  type: AutomationActionType;
  value?: string;
  selector?: string;
  timeout?: number;
}

// Base task interface for automation
export interface AutomationTask {
  url: string;
  actions: AutomationAction[];
  metadata?: {
    userId?: string;
    scheduledAt?: Date;
    priority?: number;
  };
}

// Database task interface
export interface ITask extends Document {
  name: string;
  description?: string;
  workflowId: string;
  profileId: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule?: {
    type: TaskScheduleType;
    startDate: Date;
    endDate?: Date;
    time?: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
  };
  maxRetries: number;
  timeout: number;
  parallelExecution: boolean;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  errorLogs?: string[];
}

// Combined task type for queue operations
export type Task = AutomationTask & Partial<Omit<ITask, keyof Document>>;

// ... rest of the file ... 