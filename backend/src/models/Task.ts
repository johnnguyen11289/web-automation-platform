import mongoose, { Schema, Document } from 'mongoose';
import { TaskStatus, TaskPriority, TaskScheduleType } from '../types/task.types';

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
      enum: ['once', 'daily', 'weekly', 'monthly']
    },
    startDate: Date,
    endDate: Date,
    time: String,
    daysOfWeek: [Number],
    daysOfMonth: [Number]
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