import express from 'express';
import { Execution, IExecution } from '../models/Execution';
import ExecutionService from '../services/execution.service';
import { Types } from 'mongoose';

const router = express.Router();
const executionService = ExecutionService.getInstance();

// Get all executions
router.get('/', async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;
    
    // Build query filters
    const filters: any = {};
    
    // Add status filter if provided
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Add workflow filter if provided
    if (req.query.workflowId) {
      filters.workflowId = req.query.workflowId;
    }
    
    // Add date range filters if provided
    if (req.query.startDate) {
      filters.startTime = { $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      filters.endTime = { $lte: new Date(req.query.endDate as string) };
    }

    // Get total count for pagination with filters
    const total = await Execution.countDocuments(filters);

    // Get paginated executions with filters
    const executions = await Execution.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Return paginated response
    res.json({
      executions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ message: 'Error fetching executions' });
  }
});

// Start a new execution
router.post('/', async (req, res) => {
  try {
    const { workflowId, profileId, parallel } = req.body;
    
    const execution = await executionService.queueExecution(workflowId, profileId, parallel);
    
    res.status(201).json(execution);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error starting execution',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Pause an execution
router.post('/:id/pause', async (req, res) => {
  try {
    const execution = await executionService.pauseExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ message: 'Error pausing execution' });
  }
});

// Resume an execution
router.post('/:id/resume', async (req, res) => {
  try {
    const execution = await executionService.resumeExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ message: 'Error resuming execution' });
  }
});

// Stop an execution
router.post('/:id/stop', async (req, res) => {
  try {
    const execution = await executionService.stopExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ message: 'Error stopping execution' });
  }
});

export default router; 