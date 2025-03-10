import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Workflow } from '../../services/api';
import { BrowserProfile } from '../../types/browser.types';
import { TaskFormData, TaskPriority, TaskScheduleType } from '../../types/task.types';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { SelectChangeEvent } from '@mui/material/Select';

interface WorkflowProfileMatrixProps {
  workflows: Workflow[];
  profiles: BrowserProfile[];
  onTaskCreate: (task: TaskFormData) => void;
  onTaskExecute: (workflowId: string, profileId: string) => void;
}

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: TaskFormData) => void;
  workflow: Workflow;
  profile: BrowserProfile;
}

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  workflow,
  profile,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    name: `${workflow.name} - ${profile.name}`,
    description: `Task running ${workflow.name} with profile ${profile.name}`,
    workflowId: workflow._id,
    profileId: profile._id,
    priority: 'medium',
    maxRetries: 3,
    timeout: 300000,
    parallelExecution: false,
    schedule: {
      type: 'once',
      startDate: new Date(),
      time: '00:00',
    },
  });

  const handleScheduleTypeChange = (type: TaskScheduleType) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        type,
        startDate: prev.schedule.startDate,
        time: prev.schedule.time,
        daysOfWeek: type === 'weekly' ? [1] : undefined,
        daysOfMonth: type === 'monthly' ? [1] : undefined,
      },
    }));
  };

  const handleStartDateChange = (newValue: Date | null) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          startDate: newValue,
        },
      }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        time: e.target.value,
      },
    }));
  };

  const handleDaysOfWeekChange = (e: SelectChangeEvent<number[]>) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daysOfWeek: e.target.value as unknown as number[],
      },
    }));
  };

  const handleDaysOfMonthChange = (e: SelectChangeEvent<number[]>) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daysOfMonth: e.target.value as unknown as number[],
      },
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Name"
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
              InputProps={{
                endAdornment: <InputAdornment position="end">ms</InputAdornment>,
              }}
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

          {/* Schedule Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Schedule
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Schedule Type</InputLabel>
                  <Select
                    value={formData.schedule.type}
                    label="Schedule Type"
                    onChange={(e) => handleScheduleTypeChange(e.target.value as TaskScheduleType)}
                  >
                    <MenuItem value="once">Once</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Date"
                    value={formData.schedule.startDate}
                    onChange={handleStartDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              {formData.schedule.type !== 'once' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    value={formData.schedule.time}
                    onChange={handleTimeChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              {formData.schedule.type === 'weekly' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Days of Week</InputLabel>
                    <Select
                      multiple
                      value={formData.schedule.daysOfWeek || [1]}
                      label="Days of Week"
                      onChange={handleDaysOfWeekChange}
                    >
                      <MenuItem value={0}>Sunday</MenuItem>
                      <MenuItem value={1}>Monday</MenuItem>
                      <MenuItem value={2}>Tuesday</MenuItem>
                      <MenuItem value={3}>Wednesday</MenuItem>
                      <MenuItem value={4}>Thursday</MenuItem>
                      <MenuItem value={5}>Friday</MenuItem>
                      <MenuItem value={6}>Saturday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {formData.schedule.type === 'monthly' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Days of Month</InputLabel>
                    <Select
                      multiple
                      value={formData.schedule.daysOfMonth || [1]}
                      label="Days of Month"
                      onChange={handleDaysOfMonthChange}
                    >
                      {Array.from({ length: 31 }, (_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {i + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkflowProfileMatrix: React.FC<WorkflowProfileMatrixProps> = ({
  workflows,
  profiles,
  onTaskCreate,
  onTaskExecute,
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BrowserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateTask = (workflow: Workflow, profile: BrowserProfile) => {
    setSelectedWorkflow(workflow);
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

  const handleExecuteTask = (workflowId: string, profileId: string) => {
    onTaskExecute(workflowId, profileId);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Workflow-Profile Matrix
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Workflow / Profile</TableCell>
              {profiles.map((profile) => (
                <TableCell key={profile._id}>{profile.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow._id}>
                <TableCell component="th" scope="row">
                  {workflow.name}
                </TableCell>
                {profiles.map((profile) => (
                  <TableCell key={profile._id}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Create Task">
                        <IconButton
                          size="small"
                          onClick={() => handleCreateTask(workflow, profile)}
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Execute Now">
                        <IconButton
                          size="small"
                          onClick={() => handleExecuteTask(workflow._id, profile._id)}
                          color="success"
                        >
                          <PlayIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedWorkflow && selectedProfile && (
        <TaskFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={onTaskCreate}
          workflow={selectedWorkflow}
          profile={selectedProfile}
        />
      )}
    </Box>
  );
};

export default WorkflowProfileMatrix; 