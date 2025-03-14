import mongoose, { Schema, Document, model } from 'mongoose';
import { TaskStatus, TaskPriority, TaskScheduleType } from '../types/task.types';

interface BaseTaskSchedule {
  type: TaskScheduleType;
  startDate: Date;
  endDate?: Date;
}

interface OnceSchedule extends BaseTaskSchedule {
  type: 'once';
}

interface EverySchedule extends BaseTaskSchedule {
  type: 'every';
  interval: number; // hours
}

interface DailySchedule extends BaseTaskSchedule {
  type: 'daily';
  time: string;
}

interface WeeklySchedule extends BaseTaskSchedule {
  type: 'weekly';
  time: string;
  daysOfWeek: number[];
}

interface MonthlySchedule extends BaseTaskSchedule {
  type: 'monthly';
  time: string;
  daysOfMonth: number[];
}

export type TaskSchedule = OnceSchedule | EverySchedule | DailySchedule | WeeklySchedule | MonthlySchedule;

export interface ITask extends Document {
  name: string;
  description?: string;
  workflowId: string;
  profileId: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule: TaskSchedule;
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

const TaskSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  workflowId: { type: String, required: true },
  profileId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'scheduled', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  schedule: {
    type: {
      type: String,
      enum: ['once', 'every', 'daily', 'weekly', 'monthly'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    time: { type: String },
    interval: { type: Number },
    daysOfWeek: [{ type: Number }],
    daysOfMonth: [{ type: Number }],
  },
  maxRetries: { type: Number, default: 3 },
  timeout: { type: Number, default: 300000 }, // 5 minutes in milliseconds
  parallelExecution: { type: Boolean, default: false },
  dependencies: [{ type: String }],
  lastRun: Date,
  nextRun: Date,
  errorLogs: [String]
}, {
  timestamps: true
});

export default mongoose.model<ITask>('Task', TaskSchema); 