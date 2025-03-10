import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  status: 'active' | 'inactive';
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: any;
    connections: string[];
  }>;
}

const WorkflowSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  nodes: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    properties: { type: Schema.Types.Mixed, required: true },
    connections: [{ type: String }]
  }]
});

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema); 