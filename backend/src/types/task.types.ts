export type TaskStatus = 'pending' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'every';

export interface TaskSchedule {
  type: TaskScheduleType;
  startDate: Date;
  endDate?: Date;
  time?: string;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  interval?: number; // Hours between executions for 'every' type
  lastRun?: Date; // Last execution time for calculating next run
}

export interface Task {
  _id: string;
  name: string;
  description?: string;
  workflowId: string;
  profileId: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule?: TaskSchedule;
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

export interface TaskFormData {
  name: string;
  description?: string;
  workflowId: string;
  profileId: string;
  priority: TaskPriority;
  schedule?: TaskSchedule;
  maxRetries: number;
  timeout: number;
  parallelExecution: boolean;
  dependencies?: string[];
} 