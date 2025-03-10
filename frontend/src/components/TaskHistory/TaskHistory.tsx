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
  Collapse,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Refresh,
  Download,
} from '@mui/icons-material';

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
  executions: TaskExecution[];
  onRefresh: () => void;
  onExportLogs: (taskId: string) => void;
}

const Row: React.FC<{ execution: TaskExecution; onExportLogs: (taskId: string) => void }> = ({
  execution,
  onExportLogs,
}) => {
  const [open, setOpen] = useState(false);
  const [showFullLogs, setShowFullLogs] = useState(false);

  const getStatusColor = (status: TaskExecution['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getLogColor = (level: TaskLog['level']) => {
    switch (level) {
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return 'inherit';
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {execution.workflowName}
        </TableCell>
        <TableCell>
          <Chip
            label={execution.status}
            color={getStatusColor(execution.status)}
            size="small"
          />
        </TableCell>
        <TableCell>{new Date(execution.startTime).toLocaleString()}</TableCell>
        <TableCell>{execution.duration}</TableCell>
        <TableCell>
          <IconButton size="small" onClick={() => onExportLogs(execution.id)}>
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
                {execution.logs.slice(0, 5).map((log, index) => (
                  <Box
                    key={index}
                    sx={{ color: getLogColor(log.level), whiteSpace: 'pre-wrap' }}
                  >
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                  </Box>
                ))}
                {execution.logs.length > 5 && !showFullLogs && (
                  <Box sx={{ mt: 1, color: 'text.secondary' }}>
                    ... and {execution.logs.length - 5} more entries
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
        <DialogTitle>Full Logs - {execution.workflowName}</DialogTitle>
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
            {execution.logs.map((log, index) => (
              <Box
                key={index}
                sx={{ color: getLogColor(log.level), whiteSpace: 'pre-wrap' }}
              >
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullLogs(false)}>Close</Button>
          <Button
            onClick={() => onExportLogs(execution.id)}
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
  executions,
  onRefresh,
  onExportLogs,
}) => {
  return (
    <Paper elevation={2}>
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Task History</Typography>
          <Button startIcon={<Refresh />} onClick={onRefresh}>
            Refresh
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Workflow</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executions.map((execution) => (
                <Row
                  key={execution.id}
                  execution={execution}
                  onExportLogs={onExportLogs}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default TaskHistory; 