import express from 'express';
import { Execution, IExecution } from '../models/Execution';
import ExecutionService from '../services/ExecutionService';
import { Types } from 'mongoose';

const router = express.Router();
const executionService = ExecutionService.getInstance();

// Get all executions
router.get('/', async (req, res) => {
  try {
    const executions = await Execution.find().sort({ createdAt: -1 });
    res.json(executions);
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ message: 'Error fetching executions' });
  }
});

// Start a new execution
router.post('/', async (req, res) => {
  try {
    console.log('Received execution request:', req.body);
    const { workflowId, profileId, parallel } = req.body;
    
    console.log('Starting execution with:', {
      workflowId,
      profileId,
      parallel
    });
    
    const execution = await executionService.queueExecution(workflowId, profileId, parallel);
    console.log('Execution queued successfully:', (execution._id as Types.ObjectId).toString());
    
    res.status(201).json(execution);
  } catch (error) {
    console.error('Error starting execution:', error);
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
    console.error('Error pausing execution:', error);
    res.status(500).json({ message: 'Error pausing execution' });
  }
});

// Resume an execution
router.post('/:id/resume', async (req, res) => {
  try {
    const execution = await executionService.resumeExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    console.error('Error resuming execution:', error);
    res.status(500).json({ message: 'Error resuming execution' });
  }
});

// Stop an execution
router.post('/:id/stop', async (req, res) => {
  try {
    const execution = await executionService.stopExecution(req.params.id);
    res.json(execution);
  } catch (error) {
    console.error('Error stopping execution:', error);
    res.status(500).json({ message: 'Error stopping execution' });
  }
});

export default router; 