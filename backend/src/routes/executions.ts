import express from 'express';
import { Execution, IExecution } from '../models/Execution';
import ExecutionService from '../services/execution.service';
import { Types } from 'mongoose';

const router = express.Router();
const executionService = ExecutionService.getInstance();

// Get all executions
router.get('/', async (req, res) => {
  try {
    const executions = await Execution.find().sort({ createdAt: -1 });
    res.json(executions);
  } catch (error) {
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