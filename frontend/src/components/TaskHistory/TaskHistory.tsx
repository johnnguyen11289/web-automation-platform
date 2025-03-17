import React, { useState, useEffect } from 'react';
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
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Refresh,
  Download,
} from '@mui/icons-material';
import { Execution, ExecutionStatus } from '../../types/execution.types';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface TaskLog {
  timestamp: string;
  level: 'info' | 'error' | 'warning';
  message: string;
}

interface TaskExecution {
  id: string;
  workflowName: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime: string;
  duration: string;
  logs: TaskLog[];
}

interface TaskHistoryProps {
  executions: Execution[];
  total: number;
  onRefresh: (page: number, pageSize: number, filters: {
    status?: ExecutionStatus;
    startDate?: string;
    endDate?: string;
  }) => void;
  onExportLogs: (taskId: string) => void;
}

const getStatusColor = (status: ExecutionStatus) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'stopped':
      return 'warning';
    case 'running':
      return 'info';
    case 'paused':
      return 'default';
    default:
      return 'default';
  }
};

interface RowProps {
  execution: Execution;
  onExportLogs: (taskId: string) => void;
}

const Row: React.FC<RowProps> = ({ execution, onExportLogs }) => {
  const [open, setOpen] = useState(false);
  const [showFullLogs, setShowFullLogs] = useState(false);

  const getLogColor = (level: 'info' | 'error' | 'warning') => {
    switch (level) {
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return 'inherit';
    }
  };

  const duration = execution.endTime 
    ? new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()
    : null;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {execution.workflowId}
        </TableCell>
        <TableCell>
          <Chip
            label={execution.status}
            color={getStatusColor(execution.status)}
            size="small"
          />
        </TableCell>
        <TableCell>{new Date(execution.startTime).toLocaleString()}</TableCell>
        <TableCell>{duration ? `${Math.round(duration / 1000)}s` : 'N/A'}</TableCell>
        <TableCell>
          <IconButton size="small" onClick={() => onExportLogs(execution._id)}>
            <Download />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Logs
                <Button
                  size="small"
                  onClick={() => setShowFullLogs(true)}
                  sx={{ ml: 2 }}
                >
                  View Full Logs
                </Button>
              </Typography>
              <Box
                sx={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  bgcolor: '#f5f5f5',
                  p: 1,
                }}
              >
                {execution.errorLogs.slice(0, 5).map((log: string, index: number) => (
                  <Box
                    key={index}
                    sx={{ color: getLogColor('error'), whiteSpace: 'pre-wrap' }}
                  >
                    {log}
                  </Box>
                ))}
                {execution.errorLogs.length > 5 && !showFullLogs && (
                  <Box sx={{ mt: 1, color: 'text.secondary' }}>
                    ... and {execution.errorLogs.length - 5} more entries
                  </Box>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Dialog
        open={showFullLogs}
        onClose={() => setShowFullLogs(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Full Logs - {execution.workflowId}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              maxHeight: '500px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              bgcolor: '#f5f5f5',
              p: 2,
            }}
          >
            {execution.errorLogs.map((log: string, index: number) => (
              <Box
                key={index}
                sx={{ color: getLogColor('error'), whiteSpace: 'pre-wrap' }}
              >
                {log}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullLogs(false)}>Close</Button>
          <Button
            onClick={() => onExportLogs(execution._id)}
            startIcon={<Download />}
          >
            Export Logs
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const TaskHistory: React.FC<TaskHistoryProps> = ({
  executions = [],
  total = 0,
  onRefresh,
  onExportLogs,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('TaskHistory: Loading data with params:', {
          page: page + 1,
          rowsPerPage,
          statusFilter,
          startDate,
          endDate
        });
        await onRefresh(page + 1, rowsPerPage, {
          status: statusFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      } catch (error) {
        console.error('TaskHistory: Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [page, rowsPerPage, statusFilter, startDate, endDate]);

  // Add debug logging for executions prop
  useEffect(() => {
    console.log('TaskHistory: Received executions:', executions);
  }, [executions]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = (event: SelectChangeEvent<ExecutionStatus | ''>) => {
    setStatusFilter(event.target.value as ExecutionStatus | '');
    setPage(0);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
    setPage(0);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
    setPage(0);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh(page + 1, rowsPerPage, {
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Task History</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusChange}
              disabled={isLoading}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="stopped">Stopped</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            disabled={isLoading}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Workflow</TableCell>
              <TableCell>Profile</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography>Loading executions...</Typography>
                </TableCell>
              </TableRow>
            ) : !executions || executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography>No executions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => (
                <TableRow key={execution._id}>
                  <TableCell>{execution._id}</TableCell>
                  <TableCell>{execution.workflowId}</TableCell>
                  <TableCell>{execution.profileId}</TableCell>
                  <TableCell>
                    <Chip
                      label={execution.status}
                      color={getStatusColor(execution.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(execution.startTime).toLocaleString()}</TableCell>
                  <TableCell>
                    {execution.endTime ? new Date(execution.endTime).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {execution.endTime
                      ? `${Math.round(
                          (new Date(execution.endTime).getTime() -
                            new Date(execution.startTime).getTime()) /
                            1000
                        )}s`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => onExportLogs(execution._id)}
                    >
                      <Download />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
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
        disabled={isLoading}
      />
    </Box>
  );
};

export default TaskHistory; 