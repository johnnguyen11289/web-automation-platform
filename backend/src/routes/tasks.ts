import express from 'express';
import Task, { ITask } from '../models/Task';
import { TaskFormData } from '../types/task.types';

const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const taskData: TaskFormData = req.body;
    const task = new Task(taskData);
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const taskData: Partial<TaskFormData> = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      taskData,
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Start a task
router.post('/:id/start', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.status = 'running';
    task.lastRun = new Date();
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Error starting task:', error);
    res.status(500).json({ message: 'Error starting task' });
  }
});

// Pause a task
router.post('/:id/pause', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.status = 'pending';
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Error pausing task:', error);
    res.status(500).json({ message: 'Error pausing task' });
  }
});

// Stop a task
router.post('/:id/stop', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.status = 'cancelled';
    await task.save();
    
    res.json(task);
  } catch (error) {
    console.error('Error stopping task:', error);
    res.status(500).json({ message: 'Error stopping task' });
  }
});

export default router; 