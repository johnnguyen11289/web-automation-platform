export type ExecutionStatus = 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  status: ExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface Execution {
  _id: string;
  workflowId: string;
  profileId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  errorLogs: string[];
  currentStep?: ExecutionStep;
  queuePosition?: number;
  parallelExecution: boolean;
  steps: ExecutionStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionStats {
  totalExecutions: number;
  runningExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageDuration: number;
} 