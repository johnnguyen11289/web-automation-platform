import mongoose, { Schema, Document } from 'mongoose';
import { TaskStatus, TaskPriority, TaskScheduleType } from '../types/task.types';

export interface ITaskSchedule {
  type: TaskScheduleType;
  startDate: Date;
  endDate?: Date;
  time?: string;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
}

export interface ITask extends Document {
  name: string;
  description: string;
  workflowId: string;
  profileId: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule: ITaskSchedule;
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

const taskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    workflowId: { type: String, required: true },
    profileId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'scheduled', 'running', 'completed', 'failed', 'cancelled'], default: 'pending' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    schedule: {
      type: { type: String, enum: ['once', 'daily', 'weekly', 'monthly'], required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      time: { type: String },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      daysOfMonth: [{ type: Number, min: 1, max: 31 }],
    },
    maxRetries: { type: Number, default: 3 },
    timeout: { type: Number, default: 300000 }, // 5 minutes in milliseconds
    parallelExecution: { type: Boolean, default: false },
    dependencies: [{ type: String }],
    lastRun: { type: Date },
    nextRun: { type: Date },
    errorLogs: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index for querying tasks by status and next run time
taskSchema.index({ status: 1, nextRun: 1 });

// Index for querying tasks by workflow and profile
taskSchema.index({ workflowId: 1, profileId: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema); 