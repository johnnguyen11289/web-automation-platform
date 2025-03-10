import { IWorkflow } from '../models/workflow.model';
import { Workflow } from '../models/workflow.model';
import mongoose from 'mongoose';

class InMemoryWorkflowService {
  private workflows: IWorkflow[] = [];

  async createWorkflow(workflowData: Partial<IWorkflow>): Promise<IWorkflow> {
    console.log('Service: Creating workflow with data:', workflowData);
    const workflow: IWorkflow = {
      _id: Math.random().toString(36).substr(2, 9),
      name: workflowData.name || 'Untitled Workflow',
      description: workflowData.description,
      createdAt: new Date(),
      status: workflowData.status || 'active',
      nodes: workflowData.nodes || [],
    };
    console.log('Service: Created workflow:', workflow);
    this.workflows.push(workflow);
    console.log('Service: Current workflows:', this.workflows);
    return workflow;
  }

  async getAllWorkflows(): Promise<IWorkflow[]> {
    console.log('Service: Getting all workflows. Count:', this.workflows.length);
    return this.workflows;
  }

  async getWorkflowById(id: string): Promise<IWorkflow | null> {
    console.log('Service: Getting workflow by id:', id);
    const workflow = this.workflows.find(w => w._id === id) || null;
    console.log('Service: Found workflow:', workflow);
    return workflow;
  }

  async updateWorkflow(id: string, workflowData: Partial<IWorkflow>): Promise<IWorkflow | null> {
    console.log('Service: Updating workflow:', id, 'with data:', workflowData);
    const index = this.workflows.findIndex(w => w._id === id);
    if (index === -1) {
      console.log('Service: Workflow not found');
      return null;
    }

    this.workflows[index] = {
      ...this.workflows[index],
      ...workflowData,
    };
    console.log('Service: Updated workflow:', this.workflows[index]);
    return this.workflows[index];
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    console.log('Service: Deleting workflow:', id);
    const index = this.workflows.findIndex(w => w._id === id);
    if (index === -1) {
      console.log('Service: Workflow not found');
      return false;
    }

    this.workflows.splice(index, 1);
    console.log('Service: Workflow deleted. Current count:', this.workflows.length);
    return true;
  }
}

class MongoDBWorkflowService {
  async createWorkflow(workflowData: Partial<IWorkflow>): Promise<IWorkflow> {
    console.log('Service: Creating workflow with data:', workflowData);
    try {
      const workflow = new Workflow({
        name: workflowData.name || 'Untitled Workflow',
        description: workflowData.description,
        status: workflowData.status || 'active',
        nodes: workflowData.nodes || [],
      });
      const savedWorkflow = await workflow.save();
      console.log('Service: Created workflow:', savedWorkflow);
      return savedWorkflow;
    } catch (error) {
      console.error('Service: Error creating workflow:', error);
      throw error;
    }
  }

  async getAllWorkflows(): Promise<IWorkflow[]> {
    console.log('Service: Fetching all workflows');
    try {
      const workflows = await Workflow.find().sort({ createdAt: -1 });
      console.log('Service: Found workflows:', workflows.length);
      return workflows;
    } catch (error) {
      console.error('Service: Error fetching workflows:', error);
      throw error;
    }
  }

  async getWorkflowById(id: string): Promise<IWorkflow | null> {
    console.log('Service: Fetching workflow by ID:', id);
    try {
      const workflow = await Workflow.findById(id);
      console.log('Service: Found workflow:', workflow ? 'yes' : 'no');
      return workflow;
    } catch (error) {
      console.error('Service: Error fetching workflow:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, workflowData: Partial<IWorkflow>): Promise<IWorkflow | null> {
    console.log('Service: Updating workflow:', id);
    try {
      const workflow = await Workflow.findByIdAndUpdate(
        id,
        { $set: workflowData },
        { new: true }
      );
      console.log('Service: Updated workflow:', workflow ? 'yes' : 'no');
      return workflow;
    } catch (error) {
      console.error('Service: Error updating workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    console.log('Service: Deleting workflow:', id);
    try {
      const result = await Workflow.findByIdAndDelete(id);
      console.log('Service: Deleted workflow:', result ? 'yes' : 'no');
      return !!result;
    } catch (error) {
      console.error('Service: Error deleting workflow:', error);
      throw error;
    }
  }
}

// Create a hybrid service that uses MongoDB if available, otherwise falls back to in-memory storage
class HybridWorkflowService {
  private mongoService: MongoDBWorkflowService;
  private inMemoryService: InMemoryWorkflowService;
  private useMongoDB: boolean;

  constructor() {
    this.mongoService = new MongoDBWorkflowService();
    this.inMemoryService = new InMemoryWorkflowService();
    this.useMongoDB = mongoose.connection.readyState === 1;
    console.log('Service: Using MongoDB:', this.useMongoDB);
  }

  async createWorkflow(workflowData: Partial<IWorkflow>): Promise<IWorkflow> {
    if (this.useMongoDB) {
      try {
        return await this.mongoService.createWorkflow(workflowData);
      } catch (error) {
        console.warn('Service: MongoDB create failed, falling back to in-memory storage');
        this.useMongoDB = false;
      }
    }
    return this.inMemoryService.createWorkflow(workflowData);
  }

  async getAllWorkflows(): Promise<IWorkflow[]> {
    if (this.useMongoDB) {
      try {
        return await this.mongoService.getAllWorkflows();
      } catch (error) {
        console.warn('Service: MongoDB getAll failed, falling back to in-memory storage');
        this.useMongoDB = false;
      }
    }
    return this.inMemoryService.getAllWorkflows();
  }

  async getWorkflowById(id: string): Promise<IWorkflow | null> {
    if (this.useMongoDB) {
      try {
        return await this.mongoService.getWorkflowById(id);
      } catch (error) {
        console.warn('Service: MongoDB getById failed, falling back to in-memory storage');
        this.useMongoDB = false;
      }
    }
    return this.inMemoryService.getWorkflowById(id);
  }

  async updateWorkflow(id: string, workflowData: Partial<IWorkflow>): Promise<IWorkflow | null> {
    if (this.useMongoDB) {
      try {
        return await this.mongoService.updateWorkflow(id, workflowData);
      } catch (error) {
        console.warn('Service: MongoDB update failed, falling back to in-memory storage');
        this.useMongoDB = false;
      }
    }
    return this.inMemoryService.updateWorkflow(id, workflowData);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    if (this.useMongoDB) {
      try {
        return await this.mongoService.deleteWorkflow(id);
      } catch (error) {
        console.warn('Service: MongoDB delete failed, falling back to in-memory storage');
        this.useMongoDB = false;
      }
    }
    return this.inMemoryService.deleteWorkflow(id);
  }
}

export const workflowService = new HybridWorkflowService(); 