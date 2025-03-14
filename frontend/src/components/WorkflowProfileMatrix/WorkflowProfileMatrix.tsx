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
import { 
  TaskFormData, 
  TaskPriority, 
  TaskScheduleType,
  TaskSchedule,
  OnceSchedule,
  EverySchedule,
  DailySchedule,
  WeeklySchedule,
  MonthlySchedule 
} from '../../types/task.types';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { SelectChangeEvent } from '@mui/material/Select';
import { api } from '../../services/api';

interface WorkflowProfileMatrixProps {
  workflows: Workflow[];
  profiles: BrowserProfile[];
  onTaskCreate: (task: TaskFormData) => Promise<void>;
  onTaskExecute: (workflowId: string, profileId: string) => Promise<void>;
}

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: TaskFormData) => Promise<void>;
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
      startDate: new Date().toISOString(),
    },
  });

  const handleScheduleTypeChange = (type: TaskScheduleType) => {
    let newSchedule: TaskSchedule;

    switch (type) {
      case 'once':
        newSchedule = {
          type: 'once',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
        };
        break;
      case 'every':
        newSchedule = {
          type: 'every',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          interval: 1,
        };
        break;
      case 'daily':
        newSchedule = {
          type: 'daily',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          time: '00:00',
        };
        break;
      case 'weekly':
        newSchedule = {
          type: 'weekly',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          time: '00:00',
          daysOfWeek: [1],
        };
        break;
      case 'monthly':
        newSchedule = {
          type: 'monthly',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          time: '00:00',
          daysOfMonth: [1],
        };
        break;
    }

    setFormData(prev => ({
      ...prev,
      schedule: newSchedule,
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

  const handleEndDateChange = (newValue: Date | null) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          endDate: newValue,
        },
      }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData.schedule.type !== 'once' && formData.schedule.type !== 'every') {
      const schedule = formData.schedule as DailySchedule | WeeklySchedule | MonthlySchedule;
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...schedule,
          time: e.target.value,
        },
      }));
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData.schedule.type === 'every') {
      const schedule = formData.schedule as EverySchedule;
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...schedule,
          interval: Math.max(1, parseInt(e.target.value) || 1),
        },
      }));
    }
  };

  const handleDaysOfWeekChange = (e: SelectChangeEvent<number[]>) => {
    if (formData.schedule.type === 'weekly') {
      const schedule = formData.schedule as WeeklySchedule;
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...schedule,
          daysOfWeek: e.target.value as number[],
        },
      }));
    }
  };

  const handleDaysOfMonthChange = (e: SelectChangeEvent<number[]>) => {
    if (formData.schedule.type === 'monthly') {
      const schedule = formData.schedule as MonthlySchedule;
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...schedule,
          daysOfMonth: e.target.value as number[],
        },
      }));
    }
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
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
                    onChange={(e) => handleScheduleTypeChange(e.target.value as TaskScheduleType)}
                    label="Schedule Type"
                  >
                    <MenuItem value="once">Once</MenuItem>
                    <MenuItem value="every">Every X Hours</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.schedule.type === 'every' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Interval (hours)"
                    value={(formData.schedule as EverySchedule).interval}
                    onChange={handleIntervalChange}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
              )}
              {formData.schedule.type !== 'once' && formData.schedule.type !== 'every' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Time"
                    value={(formData.schedule as DailySchedule | WeeklySchedule | MonthlySchedule).time}
                    onChange={handleTimeChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Date"
                    value={new Date(formData.schedule.startDate)}
                    onChange={handleStartDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="End Date (Optional)"
                    value={formData.schedule.endDate ? new Date(formData.schedule.endDate) : null}
                    onChange={handleEndDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              {formData.schedule.type === 'weekly' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Days of Week</InputLabel>
                    <Select
                      multiple
                      value={(formData.schedule as WeeklySchedule).daysOfWeek}
                      onChange={handleDaysOfWeekChange}
                      label="Days of Week"
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
                      value={(formData.schedule as MonthlySchedule).daysOfMonth}
                      onChange={handleDaysOfMonthChange}
                      label="Days of Month"
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
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BrowserProfile | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOpenDialog = (workflow: Workflow, profile: BrowserProfile) => {
    setSelectedWorkflow(workflow);
    setSelectedProfile(profile);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWorkflow(null);
    setSelectedProfile(null);
  };

  const handleTaskCreate = async (task: TaskFormData) => {
    await onTaskCreate(task);
  };

  const handleTaskExecute = async (workflowId: string, profileId: string) => {
    try {
      // Start a test execution
      await api.startExecution(workflowId, profileId, false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Workflow test started successfully',
        severity: 'success'
      });
    } catch (error) {
      // Show error message
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to test workflow',
        severity: 'error'
      });
    }
  };

  if (workflows.length === 0 || profiles.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Paper elevation={2}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {workflows.length === 0 ? 'No Workflows Available' : 'No Browser Profiles Available'}
            </Typography>
            <Typography color="text.secondary" paragraph>
              {workflows.length === 0
                ? 'Create workflows to start building your automation matrix.'
                : 'Create browser profiles to start building your automation matrix.'}
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        MATRIX TASK CREATION
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  backgroundColor: 'background.default',
                  borderRight: '1px solid',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  fontWeight: 'bold'
                }}
              >
                Workflow / Profile
              </TableCell>
              {profiles.map((profile) => (
                <TableCell 
                  key={profile._id}
                  sx={{ 
                    backgroundColor: 'background.default',
                    borderRight: '1px solid',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}
                >
                  {profile.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow._id}>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ 
                    backgroundColor: 'background.default',
                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    fontWeight: 'bold'
                  }}
                >
                  {workflow.name}
                </TableCell>
                {profiles.map((profile) => (
                  <TableCell 
                    key={profile._id}
                    sx={{ 
                      borderRight: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      textAlign: 'center',
                      padding: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Create Task">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(workflow, profile)}
                          color="primary"
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Execute Now">
                        <IconButton
                          size="small"
                          onClick={() => handleTaskExecute(workflow._id, profile._id)}
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
          open={openDialog}
          onClose={handleCloseDialog}
          onSubmit={handleTaskCreate}
          workflow={selectedWorkflow}
          profile={selectedProfile}
        />
      )}
    </Box>
  );
};

export default WorkflowProfileMatrix; 