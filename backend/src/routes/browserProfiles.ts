import express from 'express';
import { BrowserProfileModel } from '../models/BrowserProfile';
import { BrowserProfile } from '../types/browser.types';
import { AutomationService } from '../services/automation.service';

const router = express.Router();

// Get all browser profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await BrowserProfileModel.find().sort({ createdAt: -1 });
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching browser profiles:', error);
    res.status(500).json({ error: 'Failed to fetch browser profiles' });
  }
});

// Create a new browser profile
router.post('/', async (req, res) => {
  try {
    const profile = new BrowserProfileModel(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update a browser profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body as Partial<BrowserProfile>;
    const profile = await BrowserProfileModel.findByIdAndUpdate(
      id,
      profileData,
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ error: 'Browser profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error updating browser profile:', error);
    res.status(500).json({ error: 'Failed to update browser profile' });
  }
});

// Delete a browser profile
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await BrowserProfileModel.findByIdAndDelete(id);
    if (!profile) {
      return res.status(404).json({ error: 'Browser profile not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting browser profile:', error);
    res.status(500).json({ error: 'Failed to delete browser profile' });
  }
});

// Add endpoint to open browser profile for setup
router.post('/:id/open', async (req, res) => {
  try {
    const profile = await BrowserProfileModel.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const automationService = AutomationService.getInstance();
    await automationService.openProfileForSetup(profile);
    
    res.status(200).json({ message: 'Browser opened successfully' });
  } catch (error) {
    console.error('Error opening browser profile:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Add endpoint to close browser profile setup
router.post('/:id/close', async (req, res) => {
  try {
    const profile = await BrowserProfileModel.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const automationService = AutomationService.getInstance();
    await automationService.closeProfileSetup();
    
    res.status(200).json({ message: 'Browser closed successfully' });
  } catch (error) {
    console.error('Error closing browser profile:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router; 