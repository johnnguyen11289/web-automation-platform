import express from 'express';
import { BrowserProfileModel } from '../models/BrowserProfile';
import { BrowserProfile } from '../types/browser.types';

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
    const profileData = req.body as Omit<BrowserProfile, 'id' | 'createdAt' | 'updatedAt'>;
    const profile = new BrowserProfileModel(profileData);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating browser profile:', error);
    res.status(500).json({ error: 'Failed to create browser profile' });
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

export default router; 