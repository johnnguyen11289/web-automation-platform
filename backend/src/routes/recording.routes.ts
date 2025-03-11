import { Router } from 'express';
import { BrowserProfileModel } from '../models/BrowserProfile';
import { CodegenService } from '../services/codegen.service';

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
        await codegenService.startRecording(profile);

        res.status(200).json({ message: 'Recording started successfully' });
    } catch (error) {
        console.error('Failed to start recording:', error);
        res.status(500).json({ error: 'Failed to start recording' });
    }
});

export default router; 