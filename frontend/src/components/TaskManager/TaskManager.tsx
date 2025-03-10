import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Task, TaskStatus, TaskPriority, TaskStats, TaskFormData } from '../../types/task.types';
import { Workflow } from '../../services/api';
import { BrowserProfile } from '../../types/browser.types';
import { formatDuration } from '../../utils/dateUtils';

interface TaskManagerProps {
  workflows: Workflow[];
  profiles: BrowserProfile[];
  onAdd: (task: TaskFormData) => void;
  onEdit: (id: string, task: TaskFormData) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onRefresh: () => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'running':
      return 'success';
    case 'scheduled':
      return 'info';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'primary';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};

const TaskManager: React.FC<TaskManagerProps> = ({
  workflows,
  profiles,
  onAdd,
  onEdit,
  onDelete,
  onStart,
  onPause,
  onStop,
  onRefresh,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    scheduledTasks: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    workflowId: '',
    profileId: '',
    priority: 'medium',
    maxRetries: 3,
    timeout: 300000, // 5 minutes
    parallelExecution: false,
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      setTasks(data);
      updateStats(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const updateStats = (tasks: Task[]) => {
    const stats: TaskStats = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      runningTasks: tasks.filter(t => t.status === 'running').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      scheduledTasks: tasks.filter(t => t.status === 'scheduled').length,
    };
    setStats(stats);
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        workflowId: task.workflowId,
        profileId: task.profileId,
        priority: task.priority,
        schedule: task.schedule,
        maxRetries: task.maxRetries,
        timeout: task.timeout,
        parallelExecution: task.parallelExecution,
        dependencies: task.dependencies,
      });
      setSelectedTask(task);
    } else {
      setFormData({
        name: '',
        description: '',
        workflowId: '',
        profileId: '',
        priority: 'medium',
        maxRetries: 3,
        timeout: 300000,
        parallelExecution: false,
      });
      setSelectedTask(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
  };

  const handleSubmit = () => {
    if (selectedTask) {
      onEdit(selectedTask._id, formData);
    } else {
      onAdd(formData);
    }
    handleCloseDialog();
  };

  const handleErrorClick = (task: Task) => {
    setSelectedTask(task);
    setErrorDialogOpen(true);
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    setSelectedTask(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Stats Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Tasks</Typography>
            <Typography variant="h4">{stats.totalTasks}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Running</Typography>
            <Typography variant="h4" color="success.main">{stats.runningTasks}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Scheduled</Typography>
            <Typography variant="h4" color="info.main">{stats.scheduledTasks}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Failed</Typography>
            <Typography variant="h4" color="error.main">{stats.failedTasks}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Task
        </Button>
        <Button
          variant="outlined"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Workflow</TableCell>
              <TableCell>Profile</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Next Run</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task._id}>
                <TableCell>{task.name}</TableCell>
                <TableCell>
                  {workflows.find(w => w._id === task.workflowId)?.name || task.workflowId}
                </TableCell>
                <TableCell>
                  {profiles.find(p => p._id === task.profileId)?.name || task.profileId}
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {task.schedule ? (
                    <Tooltip title={`${task.schedule.type} at ${task.schedule.time}`}>
                      <ScheduleIcon color="primary" />
                    </Tooltip>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {task.lastRun ? new Date(task.lastRun).toLocaleString() : '-'}
                </TableCell>
                <TableCell>
                  {task.nextRun ? new Date(task.nextRun).toLocaleString() : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(task)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  {task.status === 'pending' && (
                    <IconButton
                      size="small"
                      onClick={() => onStart(task._id)}
                      color="success"
                    >
                      <PlayIcon />
                    </IconButton>
                  )}
                  {task.status === 'running' && (
                    <IconButton
                      size="small"
                      onClick={() => onPause(task._id)}
                      color="warning"
                    >
                      <PauseIcon />
                    </IconButton>
                  )}
                  {(task.status === 'running' || task.status === 'pending') && (
                    <IconButton
                      size="small"
                      onClick={() => onStop(task._id)}
                      color="error"
                    >
                      <StopIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => onDelete(task._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                  {task.errorLogs && task.errorLogs.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => handleErrorClick(task)}
                      color="error"
                    >
                      <ErrorIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTask ? 'Edit Task' : 'New Task'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Workflow</InputLabel>
                <Select
                  value={formData.workflowId}
                  label="Workflow"
                  onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
                >
                  {workflows.map((workflow) => (
                    <MenuItem key={workflow._id} value={workflow._id}>
                      {workflow.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Browser Profile</InputLabel>
                <Select
                  value={formData.profileId}
                  label="Browser Profile"
                  onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                >
                  {profiles.map((profile) => (
                    <MenuItem key={profile._id} value={profile._id}>
                      {profile.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Retries"
                value={formData.maxRetries}
                onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Timeout (ms)"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.parallelExecution}
                    onChange={(e) => setFormData({ ...formData, parallelExecution: e.target.checked })}
                  />
                }
                label="Parallel Execution"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onClose={handleCloseErrorDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Error Logs
        </DialogTitle>
        <DialogContent>
          {selectedTask?.errorLogs?.map((error, index) => (
            <Typography key={index} sx={{ mb: 1 }}>
              {error}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskManager; 