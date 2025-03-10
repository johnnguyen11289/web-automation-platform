import { Workflow, IWorkflow } from '../models/workflow.model';

export class WorkflowService {
  async createWorkflow(workflowData: Partial<IWorkflow>): Promise<IWorkflow> {
    const workflow = new Workflow(workflowData);
    return await workflow.save();
  }

  async getAllWorkflows(): Promise<IWorkflow[]> {
    return await Workflow.find().sort({ createdAt: -1 });
  }

  async getWorkflowById(id: string): Promise<IWorkflow | null> {
    return await Workflow.findById(id);
  }

  async updateWorkflow(id: string, workflowData: Partial<IWorkflow>): Promise<IWorkflow | null> {
    return await Workflow.findByIdAndUpdate(
      id,
      workflowData,
      { new: true, runValidators: true }
    );
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const result = await Workflow.findByIdAndDelete(id);
    return result !== null;
  }
}

export const workflowService = new WorkflowService(); 