import express from 'express';
import { Execution, IExecution } from '../models/Execution';
import { WorkflowModel } from '../models/Workflow';
import { BrowserProfileModel } from '../models/BrowserProfile';

const router = express.Router();

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
    const { workflowId, profileId, parallel } = req.body;

    // Validate workflow and profile exist
    const workflow = await WorkflowModel.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const profile = await BrowserProfileModel.findById(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Browser profile not found' });
    }

    // Create new execution
    const execution = new Execution({
      workflowId,
      profileId,
      status: 'running',
      startTime: new Date(),
      parallelExecution: parallel || false,
      steps: workflow.nodes.map((node: { id: string; type: string }) => ({
        nodeId: node.id,
        nodeType: node.type,
        status: 'pending'
      }))
    });

    await execution.save();
    res.status(201).json(execution);
  } catch (error) {
    console.error('Error starting execution:', error);
    res.status(500).json({ message: 'Error starting execution' });
  }
});

// Pause an execution
router.post('/:id/pause', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    if (execution.status !== 'running') {
      return res.status(400).json({ message: 'Execution is not running' });
    }

    execution.status = 'paused';
    await execution.save();
    res.json(execution);
  } catch (error) {
    console.error('Error pausing execution:', error);
    res.status(500).json({ message: 'Error pausing execution' });
  }
});

// Resume an execution
router.post('/:id/resume', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    if (execution.status !== 'paused') {
      return res.status(400).json({ message: 'Execution is not paused' });
    }

    execution.status = 'running';
    await execution.save();
    res.json(execution);
  } catch (error) {
    console.error('Error resuming execution:', error);
    res.status(500).json({ message: 'Error resuming execution' });
  }
});

// Stop an execution
router.post('/:id/stop', async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    if (!['running', 'paused'].includes(execution.status)) {
      return res.status(400).json({ message: 'Execution cannot be stopped' });
    }

    execution.status = 'stopped';
    execution.endTime = new Date();
    await execution.save();
    res.json(execution);
  } catch (error) {
    console.error('Error stopping execution:', error);
    res.status(500).json({ message: 'Error stopping execution' });
  }
});

export default router; 