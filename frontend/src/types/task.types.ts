import { BrowserProfile } from './browser.types';
import { Workflow } from '../services/api';

export type AlertSeverity = 'success' | 'error' | 'info' | 'warning';
export type TaskStatus = 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskScheduleType = 'once' | 'every' | 'daily' | 'weekly' | 'monthly';

interface BaseTaskSchedule {
  type: TaskScheduleType;
  startDate: string | Date;
  endDate?: string | Date;
}

export interface OnceSchedule extends BaseTaskSchedule {
  type: 'once';
}

export interface EverySchedule extends BaseTaskSchedule {
  type: 'every';
  interval: number; // hours
}

export interface DailySchedule extends BaseTaskSchedule {
  type: 'daily';
  time: string;
}

export interface WeeklySchedule extends BaseTaskSchedule {
  type: 'weekly';
  time: string;
  daysOfWeek: number[];
}

export interface MonthlySchedule extends BaseTaskSchedule {
  type: 'monthly';
  time: string;
  daysOfMonth: number[];
}

export type TaskSchedule = OnceSchedule | EverySchedule | DailySchedule | WeeklySchedule | MonthlySchedule;

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
  maxRetries: number;
  timeout: number;
  parallelExecution: boolean;
  schedule: TaskSchedule;
  dependencies?: string[];
} 