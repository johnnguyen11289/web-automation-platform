import mongoose, { Schema, Document } from 'mongoose';

export type ExecutionStatus = 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export interface IExecutionStep {
  nodeId: string;
  nodeType: string;
  status: ExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  context?: Record<string, any>;
}

export interface IExecution extends Document {
  workflowId: string;
  profileId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  errorLogs: string[];
  currentStep?: IExecutionStep;
  queuePosition?: number;
  parallelExecution: boolean;
  steps: IExecutionStep[];
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionStepSchema = new Schema<IExecutionStep>({
  nodeId: { type: String, required: true },
  nodeType: { type: String, required: true },
  status: { type: String, required: true, enum: ['running', 'paused', 'completed', 'failed', 'stopped'] },
  startTime: { type: Date },
  endTime: { type: Date },
  error: { type: String },
  context: { type: Schema.Types.Mixed }
});

const ExecutionSchema = new Schema<IExecution>({
  workflowId: { type: String, required: true },
  profileId: { type: String, required: true },
  status: { type: String, required: true, enum: ['running', 'paused', 'completed', 'failed', 'stopped'] },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  errorLogs: [{ type: String }],
  currentStep: { type: ExecutionStepSchema },
  queuePosition: { type: Number },
  parallelExecution: { type: Boolean, default: false },
  steps: [{ type: ExecutionStepSchema }],
  data: { type: Schema.Types.Mixed },
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
ExecutionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema); 