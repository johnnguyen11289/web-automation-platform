import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { workflowService } from '../services/workflow.service';

const router = Router();

// Workflow CRUD endpoints
router.post('/', async (req, res) => {
  console.log('Route: POST /api/workflow - Request body:', req.body);
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    console.log('Route: Workflow created successfully:', workflow);
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Route: Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

router.get('/', async (req, res) => {
  console.log('Route: GET /api/workflow');
  try {
    const workflows = await workflowService.getAllWorkflows();
    console.log('Route: Workflows fetched successfully. Count:', workflows.length);
    res.json(workflows);
  } catch (error) {
    console.error('Route: Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.get('/:id', async (req, res) => {
  console.log('Route: GET /api/workflow/:id - ID:', req.params.id);
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    if (!workflow) {
      console.log('Route: Workflow not found');
      return res.status(404).json({ error: 'Workflow not found' });
    }
    console.log('Route: Workflow fetched successfully:', workflow);
    res.json(workflow);
  } catch (error) {
    console.error('Route: Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

router.put('/:id', async (req, res) => {
  console.log('Route: PUT /api/workflow/:id - ID:', req.params.id, 'Body:', req.body);
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      console.log('Route: Workflow not found');
      return res.status(404).json({ error: 'Workflow not found' });
    }
    console.log('Route: Workflow updated successfully:', workflow);
    res.json(workflow);
  } catch (error) {
    console.error('Route: Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

router.delete('/:id', async (req, res) => {
  console.log('Route: DELETE /api/workflow/:id - ID:', req.params.id);
  try {
    const success = await workflowService.deleteWorkflow(req.params.id);
    if (!success) {
      console.log('Route: Workflow not found');
      return res.status(404).json({ error: 'Workflow not found' });
    }
    console.log('Route: Workflow deleted successfully');
    res.status(204).send();
  } catch (error) {
    console.error('Route: Error deleting workflow:', error);
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