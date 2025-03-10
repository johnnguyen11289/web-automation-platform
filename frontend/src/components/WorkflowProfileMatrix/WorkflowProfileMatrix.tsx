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
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Workflow } from '../../services/api';
import { BrowserProfile } from '../../types/browser.types';
import { TaskFormData, TaskPriority, TaskScheduleType } from '../../types/task.types';

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
  });

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