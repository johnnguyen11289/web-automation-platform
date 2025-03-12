import express from 'express';
import Task, { ITask } from '../models/Task';
import { TaskFormData } from '../types/task.types';
import { TaskSchedulerService } from '../services/scheduler.service';

const router = express.Router();
const taskSchedulerService = TaskSchedulerService.getInstance();

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
    console.log('Creating new task with data:', JSON.stringify(req.body, null, 2));
    const taskData: TaskFormData = req.body;
    const task = new Task(taskData);
    const savedTask = await task.save();

    // Schedule task if it has schedule configuration
    if (savedTask.schedule) {
      console.log('Task has schedule configuration:', JSON.stringify(savedTask.schedule, null, 2));
      try {
        await taskSchedulerService.scheduleTask(savedTask);
        console.log('Task scheduled successfully');
      } catch (scheduleError) {
        console.error('Error scheduling task:', scheduleError);
        // Don't fail the request if scheduling fails
      }
    } else {
      console.log('Task has no schedule configuration');
    }

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating task with data:', JSON.stringify(req.body, null, 2));
    const taskData: Partial<TaskFormData> = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      taskData,
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Re-schedule task if it has schedule configuration
    if (updatedTask.schedule) {
      console.log('Updated task has schedule configuration:', JSON.stringify(updatedTask.schedule, null, 2));
      try {
        await taskSchedulerService.scheduleTask(updatedTask);
        console.log('Task re-scheduled successfully');
      } catch (scheduleError) {
        console.error('Error re-scheduling task:', scheduleError);
        // Don't fail the request if scheduling fails
      }
    } else {
      console.log('Updated task has no schedule configuration');
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
    const taskId = req.params.id;
    console.log(`Deleting task ${taskId}...`);

    // First try to remove from scheduler
    try {
      await taskSchedulerService.removeScheduledTask(taskId);
      console.log('Task removed from scheduler');
    } catch (scheduleError) {
      console.error('Error removing task from scheduler:', scheduleError);
      // Continue with deletion even if scheduler removal fails
    }

    // Then delete from database
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log(`Task ${taskId} deleted successfully`);
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