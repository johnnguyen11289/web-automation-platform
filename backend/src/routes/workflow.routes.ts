import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';

const router = Router();

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