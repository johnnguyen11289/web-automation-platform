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
  TablePagination,
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
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskStats, 
  TaskFormData, 
  TaskScheduleType,
  TaskSchedule,
  DailySchedule,
  WeeklySchedule,
  MonthlySchedule,
  AlertSeverity,
  OnceSchedule,
  EverySchedule
} from '../../types/task.types';
import { Workflow } from '../../services/api';
import { BrowserProfile } from '../../types/browser.types';
import { formatDuration } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SelectChangeEvent } from '@mui/material/Select';

interface TaskManagerProps {
  tasks: Task[];
  total: number;
  workflows: Workflow[];
  profiles: BrowserProfile[];
  onAdd: (task: TaskFormData) => Promise<void>;
  onEdit: (id: string, task: TaskFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStart: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onRefresh: (page: number, pageSize: number, filters: any) => Promise<void>;
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
  tasks: propTasks,
  total,
  onAdd,
  onEdit,
  onDelete,
  onStart,
  onPause,
  onStop,
  onRefresh,
}) => {
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    pendingTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    scheduledTasks: 0,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertSeverity;
  }>({
    open: false,
    message: '',
    severity: 'success'
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
    timeout: 300000,
    parallelExecution: false,
    schedule: {
      type: 'once',
      startDate: new Date().toISOString(),
    },
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [workflowFilter, setWorkflowFilter] = useState<string>('');

  useEffect(() => {
    updateStats(propTasks);
  }, [propTasks]);

  useEffect(() => {
    const filters = {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      workflowId: workflowFilter || undefined,
    };
    onRefresh(page + 1, rowsPerPage, filters);
  }, [page, rowsPerPage, statusFilter, priorityFilter, workflowFilter]);

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
        schedule: {
          ...task.schedule,
          startDate: new Date(task.schedule.startDate),
          endDate: task.schedule.endDate ? new Date(task.schedule.endDate) : undefined,
        },
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
        schedule: {
          type: 'once',
          startDate: new Date().toISOString(),
        },
      });
      setSelectedTask(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
  };

  const handleStart = async (id: string) => {
    await onStart(id);
  };

  const handlePause = async (id: string) => {
    await onPause(id);
  };

  const handleStop = async (id: string) => {
    await onStop(id);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const handleSubmit = async () => {
    if (selectedTask) {
      const submissionData: TaskFormData = {
        ...formData,
        schedule: {
          ...formData.schedule,
          startDate: formData.schedule.startDate instanceof Date 
            ? formData.schedule.startDate.toISOString() 
            : formData.schedule.startDate,
          endDate: formData.schedule.endDate instanceof Date 
            ? formData.schedule.endDate.toISOString() 
            : formData.schedule.endDate,
        },
      };
      await onEdit(selectedTask._id, submissionData);
    } else {
      const submissionData: TaskFormData = {
        ...formData,
        schedule: {
          ...formData.schedule,
          startDate: formData.schedule.startDate instanceof Date 
            ? formData.schedule.startDate.toISOString() 
            : formData.schedule.startDate,
          endDate: formData.schedule.endDate instanceof Date 
            ? formData.schedule.endDate.toISOString() 
            : formData.schedule.endDate,
        },
      };
      await onAdd(submissionData);
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
          interval: (formData.schedule as EverySchedule).interval || 1,
        };
        break;
      case 'daily':
        newSchedule = {
          type: 'daily',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          time: (formData.schedule as DailySchedule).time || '00:00',
        };
        break;
      case 'weekly':
        newSchedule = {
          type: 'weekly',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          time: (formData.schedule as WeeklySchedule).time || '00:00',
          daysOfWeek: (formData.schedule as WeeklySchedule).daysOfWeek || [1],
        };
        break;
      case 'monthly':
        newSchedule = {
          type: 'monthly',
          startDate: formData.schedule.startDate,
          endDate: formData.schedule.endDate,
          time: (formData.schedule as MonthlySchedule).time || '00:00',
          daysOfMonth: (formData.schedule as MonthlySchedule).daysOfMonth || [1],
        };
        break;
    }

    setFormData(prev => ({
      ...prev,
      schedule: newSchedule,
    }));
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

  const handleStartDateChange = (newValue: Date | null) => {
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          startDate: newValue.toISOString(),
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
          endDate: newValue.toISOString(),
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          endDate: undefined,
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
        } as DailySchedule | WeeklySchedule | MonthlySchedule,
      }));
    }
  };

  const renderScheduleTime = (schedule: TaskSchedule) => {
    if (schedule.type === 'daily' || schedule.type === 'weekly' || schedule.type === 'monthly') {
      return (schedule as DailySchedule | WeeklySchedule | MonthlySchedule).time;
    }
    return null;
  };

  const renderScheduleDetails = (task: Task) => {
    const schedule = task.schedule;
    return (
      <Box>
        <Typography variant="body2">
          {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
        </Typography>
        {schedule.type === 'every' && (
          <Typography variant="caption" color="textSecondary">
            Every {(schedule as EverySchedule).interval} hours
          </Typography>
        )}
        {(schedule.type === 'daily' || schedule.type === 'weekly' || schedule.type === 'monthly') && (
          <Typography variant="caption" color="textSecondary">
            {renderScheduleTime(schedule)}
          </Typography>
        )}
        {schedule.type === 'weekly' && schedule.daysOfWeek && schedule.daysOfWeek.length > 0 && (
          <Typography variant="caption" color="textSecondary">
            {schedule.daysOfWeek.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
          </Typography>
        )}
        {schedule.type === 'monthly' && schedule.daysOfMonth && schedule.daysOfMonth.length > 0 && (
          <Typography variant="caption" color="textSecondary">
            Days: {schedule.daysOfMonth.join(', ')}
          </Typography>
        )}
        <Typography variant="caption" color="textSecondary" display="block">
          From: {format(new Date(schedule.startDate), 'PPp')}
        </Typography>
        {schedule.endDate && (
          <Typography variant="caption" color="textSecondary" display="block">
            Until: {format(new Date(schedule.endDate), 'PPp')}
          </Typography>
        )}
      </Box>
    );
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = (event: SelectChangeEvent<TaskStatus | ''>) => {
    setStatusFilter(event.target.value as TaskStatus | '');
    setPage(0);
  };

  const handlePriorityChange = (event: SelectChangeEvent<TaskPriority | ''>) => {
    setPriorityFilter(event.target.value as TaskPriority | '');
    setPage(0);
  };

  const handleWorkflowChange = (event: SelectChangeEvent<string>) => {
    setWorkflowFilter(event.target.value);
    setPage(0);
  };

  return (
    <Paper elevation={2}>
      <Box p={2}>
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

        {/* Actions and Filters */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={handlePriorityChange}
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Workflow</InputLabel>
                <Select
                  value={workflowFilter}
                  onChange={handleWorkflowChange}
                  label="Workflow"
                >
                  <MenuItem value="">All</MenuItem>
                  {workflows.map((workflow) => (
                    <MenuItem key={workflow._id} value={workflow._id}>
                      {workflow.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                New Task
              </Button>
              <Button
                variant="outlined"
                onClick={() => onRefresh(page + 1, rowsPerPage, {})}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Tasks Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Workflow</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {propTasks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((task) => (
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
                    <TableCell>{renderScheduleDetails(task)}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {task.status === 'pending' && (
                          <Tooltip title="Start">
                            <IconButton
                              size="small"
                              onClick={() => handleStart(task._id)}
                              color="success"
                            >
                              <PlayIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {task.status === 'running' && (
                          <>
                            <Tooltip title="Pause">
                              <IconButton
                                size="small"
                                onClick={() => handlePause(task._id)}
                                color="warning"
                              >
                                <PauseIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Stop">
                              <IconButton
                                size="small"
                                onClick={() => handleStop(task._id)}
                                color="error"
                              >
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(task)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(task._id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        {task.errorLogs && task.errorLogs.length > 0 && (
                          <Tooltip title="View Error">
                            <IconButton
                              size="small"
                              onClick={() => handleErrorClick(task)}
                              color="error"
                            >
                              <ErrorIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />

        {/* Task Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
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
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedTask ? 'Update Task' : 'Create Task'}
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
    </Paper>
  );
};

export default TaskManager; 