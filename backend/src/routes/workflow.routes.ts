import express from 'express';
import { WorkflowModel, Workflow } from '../models/Workflow';
import { workflowController } from '../controllers/workflow.controller';
import { workflowService } from '../services/workflow.service';

const router = express.Router();

// Workflow CRUD endpoints
router.post('/', async (req, res) => {
  try {
    const workflowData = req.body as Omit<Workflow, '_id' | 'createdAt' | 'updatedAt'>;
    const workflow = new WorkflowModel(workflowData);
    await workflow.save();
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

router.get('/', async (req, res) => {
  try {
    const workflows = await WorkflowModel.find();
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workflow = await WorkflowModel.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const workflowData = req.body as Partial<Workflow>;
    const workflow = await WorkflowModel.findByIdAndUpdate(
      req.params.id,
      workflowData,
      { new: true, runValidators: true }
    );
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const workflow = await WorkflowModel.findByIdAndDelete(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// Workflow execution endpoints
router.post('/execute/openUrl', workflowController.openUrl.bind(workflowController));
router.post('/execute/click', workflowController.click.bind(workflowController));
router.post('/execute/input', workflowController.input.bind(workflowController));
router.post('/execute/submit', workflowController.submit.bind(workflowController));
router.post('/execute/wait', workflowController.wait.bind(workflowController));
router.post('/execute/condition', workflowController.condition.bind(workflowController));
router.post('/execute/loop', workflowController.loop.bind(workflowController));
router.post('/execute/extract', workflowController.extract.bind(workflowController));

// Cleanup endpoint
router.post('/cleanup', workflowController.cleanup.bind(workflowController));

export default router; 