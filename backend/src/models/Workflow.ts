import mongoose, { Schema, Document } from 'mongoose';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  properties: any;
  connections: string[];
}

export interface Workflow extends Document {
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  nodes: WorkflowNode[];
  createdAt: Date;
  updatedAt: Date;
}

// Create a schema for node properties validation
const NodePropertiesSchema = new Schema({
  waitForSelector: { type: String },
  waitForSelectorRemoval: { type: String },
  // Add other common properties here
}, { _id: false });

// Create a schema for node position
const NodePositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

// Create a schema for workflow nodes
const WorkflowNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: { type: NodePositionSchema, required: true },
  properties: { type: Schema.Types.Mixed, default: {} },
  connections: [{ type: String }]
}, { _id: false });

const WorkflowSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  nodes: [WorkflowNodeSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
WorkflowSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const WorkflowModel = mongoose.model<Workflow>('Workflow', WorkflowSchema); 