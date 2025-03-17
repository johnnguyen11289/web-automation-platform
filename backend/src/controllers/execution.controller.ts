import { Request, Response } from 'express';
import ExecutionService from '../services/execution.service';
import { ExecutionStatus } from '../models/Execution';

export class ExecutionController {
  private static instance: ExecutionController;
  private executionService: ExecutionService;

  private constructor() {
    this.executionService = ExecutionService.getInstance();
  }

  public static getInstance(): ExecutionController {
    if (!ExecutionController.instance) {
      ExecutionController.instance = new ExecutionController();
    }
    return ExecutionController.instance;
  }

  public async getExecutions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as ExecutionStatus;
      const workflowId = req.query.workflowId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await this.executionService.getPaginatedExecutions(
        page,
        pageSize,
        {
          status,
          workflowId,
          startDate,
          endDate
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching executions:', error);
      res.status(500).json({ error: 'Failed to fetch executions' });
    }
  }

  public async getExecutionById(req: Request, res: Response): Promise<void> {
    try {
      const execution = await this.executionService.getExecutionById(req.params.id);
      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }
      res.json(execution);
    } catch (error) {
      console.error('Error fetching execution:', error);
      res.status(500).json({ error: 'Failed to fetch execution' });
    }
  }

  public async startExecution(req: Request, res: Response): Promise<void> {
    try {
      const execution = await this.executionService.startExecution(req.params.id);
      res.json(execution);
    } catch (error) {
      console.error('Error starting execution:', error);
      res.status(500).json({ error: 'Failed to start execution' });
    }
  }

  public async stopExecution(req: Request, res: Response): Promise<void> {
    try {
      const execution = await this.executionService.stopExecution(req.params.id);
      res.json(execution);
    } catch (error) {
      console.error('Error stopping execution:', error);
      res.status(500).json({ error: 'Failed to stop execution' });
    }
  }

  public async pauseExecution(req: Request, res: Response): Promise<void> {
    try {
      const execution = await this.executionService.pauseExecution(req.params.id);
      res.json(execution);
    } catch (error) {
      console.error('Error pausing execution:', error);
      res.status(500).json({ error: 'Failed to pause execution' });
    }
  }

  public async resumeExecution(req: Request, res: Response): Promise<void> {
    try {
      const execution = await this.executionService.resumeExecution(req.params.id);
      res.json(execution);
    } catch (error) {
      console.error('Error resuming execution:', error);
      res.status(500).json({ error: 'Failed to resume execution' });
    }
  }

  public async deleteExecution(req: Request, res: Response): Promise<void> {
    try {
      await this.executionService.deleteExecution(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting execution:', error);
      res.status(500).json({ error: 'Failed to delete execution' });
    }
  }
} 