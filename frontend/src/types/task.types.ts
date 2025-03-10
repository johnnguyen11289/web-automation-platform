import { BrowserProfile } from './browser.types';
import { Workflow } from '../services/api';

export type TaskStatus = 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskScheduleType = 'once' | 'daily' | 'weekly' | 'monthly';

export interface TaskSchedule {
  type: TaskScheduleType;
  startDate: Date;
  endDate?: Date;
  time?: string; // HH:mm format
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
}

export interface Task {
  _id: string;
  name: string;
  description: string;
  workflowId: string;
  profileId: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule: TaskSchedule;
  maxRetries: number;
  timeout: number;
  parallelExecution: boolean;
  dependencies?: string[]; // IDs of tasks that must complete before this one
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  errorLogs?: string[];
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  scheduledTasks: number;
}

export interface TaskFormData {
  name: string;
  description: string;
  workflowId: string;
  profileId: string;
  priority: TaskPriority;
  schedule: TaskSchedule;
  maxRetries: number;
  timeout: number;
  parallelExecution: boolean;
  dependencies?: string[];
} 