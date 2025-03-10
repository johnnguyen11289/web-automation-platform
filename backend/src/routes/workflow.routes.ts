import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { workflowService } from '../services/workflow.service';

const router = Router();

// Workflow CRUD endpoints
router.post('/', async (req, res) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

router.get('/', async (req, res) => {
  try {
    const workflows = await workflowService.getAllWorkflows();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await workflowService.deleteWorkflow(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.status(204).send();
  } catch (error) {
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