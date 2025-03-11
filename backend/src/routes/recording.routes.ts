import { Router } from 'express';
import { BrowserProfileModel } from '../models/BrowserProfile';
import { CodegenService } from '../services/codegen.service';
import { WorkflowModel } from '../models/Workflow';

const router = Router();

// Start a codegen recording session
router.post('/codegen/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        
        // Find the browser profile
        const profile = await BrowserProfileModel.findById(profileId);
        if (!profile) {
            return res.status(404).json({ error: 'Browser profile not found' });
        }

        // Get codegen service instance and start recording
        const codegenService = CodegenService.getInstance();
        const generatedCode = await codegenService.startRecording(profile);

        // Convert the generated code to workflow nodes
        const nodes = convertCodeToNodes(generatedCode);

        // Create a new workflow with the recorded steps
        const workflow = await WorkflowModel.create({
            name: `Recorded Workflow ${new Date().toLocaleString()}`,
            description: 'Automatically generated from recording',
            nodes,
            status: 'active'
        });

        res.status(200).json({ 
            message: 'Recording completed successfully',
            workflowId: workflow._id
        });
    } catch (error) {
        console.error('Failed to start recording:', error);
        res.status(500).json({ error: 'Failed to start recording' });
    }
});

// Stop the current recording session
router.post('/stop', async (req, res) => {
    try {
        const codegenService = CodegenService.getInstance();
        await codegenService.stopRecording();
        res.status(200).json({ message: 'Recording stopped successfully' });
    } catch (error) {
        console.error('Failed to stop recording:', error);
        res.status(500).json({ error: 'Failed to stop recording' });
    }
});

// Helper function to convert Playwright code to workflow nodes
function convertCodeToNodes(code: string) {
    const nodes: any[] = [];
    let currentId = 1;

    // Split code into lines and process each action
    const lines = code.split('\n');
    let x = 100;
    let y = 100;

    for (const line of lines) {
        if (line.includes('goto')) {
            // Handle navigation
            const url = line.match(/['"]([^'"]+)['"]/)?.[1] || '';
            nodes.push({
                id: `node-${currentId++}`,
                type: 'openUrl',
                position: { x, y },
                properties: {
                    nodeName: `Navigate to ${url}`,
                    nodeType: 'openUrl',
                    url,
                    waitForPageLoad: true
                },
                connections: [`node-${currentId}`]
            });
        } else if (line.includes('click')) {
            // Handle clicks
            const selector = line.match(/['"]([^'"]+)['"]/)?.[1] || '';
            nodes.push({
                id: `node-${currentId++}`,
                type: 'click',
                position: { x, y },
                properties: {
                    nodeName: `Click ${selector}`,
                    nodeType: 'click',
                    selector,
                    waitForElement: true
                },
                connections: [`node-${currentId}`]
            });
        } else if (line.includes('fill') || line.includes('type')) {
            // Handle input
            const selector = line.match(/['"]([^'"]+)['"]/)?.[1] || '';
            const value = line.match(/['"]([^'"]+)['"]/)?.[2] || '';
            nodes.push({
                id: `node-${currentId++}`,
                type: 'input',
                position: { x, y },
                properties: {
                    nodeName: `Input ${value}`,
                    nodeType: 'input',
                    selector,
                    value,
                    clearBeforeInput: true
                },
                connections: [`node-${currentId}`]
            });
        }

        // Update position for next node
        y += 150;
    }

    // Remove the last connection from the final node
    if (nodes.length > 0) {
        nodes[nodes.length - 1].connections = [];
    }

    return nodes;
}

export default router; 