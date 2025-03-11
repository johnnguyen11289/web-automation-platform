import { Router } from 'express';
import { BrowserProfileModel } from '../models/BrowserProfile';
import { CodegenService } from '../services/codegen.service';
import { WorkflowModel } from '../models/Workflow';

const router = Router();

// Helper function to convert Playwright code to workflow nodes with auto-positioning
function convertCodeToNodes(code: string) {
    const nodes: any[] = [];
    let currentId = 1;

    // Initialize position variables
    let x = 100; // Starting X position
    const startY = 100; // Starting Y position
    const xOffset = 250; // Horizontal spacing between nodes
    const yOffset = 150; // Vertical spacing between nodes
    let maxNodesPerRow = 3; // Maximum nodes per row
    
    // Split code into lines and process each action
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
        // Calculate position
        const row = Math.floor(index / maxNodesPerRow);
        const col = index % maxNodesPerRow;
        const xPos = x + (col * xOffset);
        const yPos = startY + (row * yOffset);

        if (line.includes('goto')) {
            // Handle navigation
            const url = line.match(/['"]([^'"]+)['"]/)?.[1] || '';
            nodes.push({
                id: `node-${currentId}`,
                type: 'openUrl',
                position: { x: xPos, y: yPos },
                properties: {
                    nodeName: `Navigate to ${url}`,
                    nodeType: 'openUrl',
                    url,
                    waitForPageLoad: true
                },
                connections: currentId < lines.length ? [`node-${currentId + 1}`] : []
            });
            currentId++;
        } else if (line.includes('click')) {
            // Handle clicks - extract full selector between locator() call
            const selectorMatch = line.match(/locator\((.*?)\)\.click/);
            const selector = selectorMatch ? selectorMatch[1].trim() : '';
            nodes.push({
                id: `node-${currentId}`,
                type: 'click',
                position: { x: xPos, y: yPos },
                properties: {
                    nodeName: `Click element`,
                    nodeType: 'click',
                    selector,
                    waitForElement: true
                },
                connections: currentId < lines.length ? [`node-${currentId + 1}`] : []
            });
            currentId++;
        } else if (line.includes('fill')) {
            // Handle input - extract full selector and value
            const selectorMatch = line.match(/locator\((.*?)\)\.fill/);
            const valueMatch = line.match(/fill\((.*?)\)/);
            
            if (selectorMatch && valueMatch) {
                const selector = selectorMatch[1].trim();
                const value = valueMatch[1].trim().replace(/^['"]|['"]$/g, ''); // Remove only outer quotes from value
                nodes.push({
                    id: `node-${currentId}`,
                    type: 'input',
                    position: { x: xPos, y: yPos },
                    properties: {
                        nodeName: `Input "${value}"`,
                        nodeType: 'input',
                        selector,
                        value,
                        clearBeforeInput: true
                    },
                    connections: currentId < lines.length ? [`node-${currentId + 1}`] : []
                });
                currentId++;
            }
        } else if (line.includes('select')) {
            // Handle dropdowns - extract full selector and value
            const selectorMatch = line.match(/locator\((.*?)\)\.selectOption/);
            const valueMatch = line.match(/selectOption\((.*?)\)/);
            
            if (selectorMatch && valueMatch) {
                const selector = selectorMatch[1].trim();
                const value = valueMatch[1].trim().replace(/^['"]|['"]$/g, ''); // Remove only outer quotes from value
                nodes.push({
                    id: `node-${currentId}`,
                    type: 'select',
                    position: { x: xPos, y: yPos },
                    properties: {
                        nodeName: `Select "${value}"`,
                        nodeType: 'select',
                        selector,
                        value
                    },
                    connections: currentId < lines.length ? [`node-${currentId + 1}`] : []
                });
                currentId++;
            }
        }
    });

    // Remove the last connection from the final node
    if (nodes.length > 0) {
        nodes[nodes.length - 1].connections = [];
    }

    return nodes;
}

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

export default router; 