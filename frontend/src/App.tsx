import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container,
  Snackbar,
  Alert,
  Button,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import WorkflowList from './components/WorkflowManager/WorkflowList';
import ExecutionPanel from './components/ExecutionPanel/ExecutionPanel';
import TaskHistory from './components/TaskHistory/TaskHistory';
import BrowserProfileManager from './components/BrowserProfile/BrowserProfileManager';
import TaskManager from './components/TaskManager/TaskManager';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodePalette from './components/NodePalette';
import { api, Workflow } from './services/api';
import './App.css';
import { BrowserProfile } from './types/browser.types';
import { Execution, ExecutionStats } from './types/execution.types';
import { Task, TaskFormData } from './types/task.types';
import WorkflowProfileMatrix from './components/WorkflowProfileMatrix/WorkflowProfileMatrix';
import ProfileSelectionDialog from './components/ProfileSelectionDialog';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.54)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&:before': {
            display: 'none',
          },
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, height: 'calc(100vh - 112px)', overflow: 'auto' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = localStorage.getItem('currentTab');
    return savedTab ? parseInt(savedTab) : 0;
  });
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [executionStats, setExecutionStats] = useState<ExecutionStats>({
    totalExecutions: 0,
    runningExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
  });
  const [taskHistory, setTaskHistory] = useState([]);
  const [browserProfiles, setBrowserProfiles] = useState<BrowserProfile[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadWorkflows();
    loadBrowserProfiles();
    loadExecutions();
    loadTasks();
  }, []);

  const loadWorkflows = async () => {
    console.log('App: Loading workflows');
    try {
      const data = await api.getWorkflows();
      console.log('App: Workflows loaded:', data);
      setWorkflows(data);
    } catch (error) {
      console.error('App: Failed to load workflows:', error);
    }
  };

  const loadBrowserProfiles = async () => {
    try {
      const profiles = await api.getBrowserProfiles();
      setBrowserProfiles(profiles);
    } catch (error) {
      console.error('Failed to load browser profiles:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      const data = await api.getExecutions();
      setExecutions(data);
      updateExecutionStats(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  const updateExecutionStats = (executions: Execution[]) => {
    const stats: ExecutionStats = {
      totalExecutions: executions.length,
      runningExecutions: executions.filter(e => e.status === 'running').length,
      completedExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      averageDuration: calculateAverageDuration(executions),
    };
    setExecutionStats(stats);
  };

  const calculateAverageDuration = (executions: Execution[]): number => {
    const completedExecutions = executions.filter(e => e.endTime);
    if (completedExecutions.length === 0) return 0;

    const totalDuration = completedExecutions.reduce((sum, e) => {
      const duration = new Date(e.endTime!).getTime() - new Date(e.startTime).getTime();
      return sum + duration;
    }, 0);

    return totalDuration / completedExecutions.length;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    localStorage.setItem('currentTab', newValue.toString());
  };

  const handleWorkflowSave = async (workflow: { nodes: any[]; name: string; description?: string }) => {
    console.log('App: Saving workflow:', workflow);
    try {
      let newWorkflow;
      if (editingWorkflow) {
        // Update existing workflow
        newWorkflow = await api.updateWorkflow(editingWorkflow._id, {
          name: workflow.name,
          description: workflow.description || '',
          status: 'active',
          nodes: workflow.nodes,
        });
      } else {
        // Create new workflow
        newWorkflow = await api.createWorkflow({
          name: workflow.name,
          description: workflow.description || '',
          status: 'active',
          nodes: workflow.nodes,
        });
      }
      
      console.log('App: Workflow saved successfully:', newWorkflow);
      // Reload all workflows to ensure we have the latest data
      await loadWorkflows();
      setEditingWorkflow(null); // Reset editing state
      return true;
    } catch (error) {
      console.error('App: Error saving workflow:', error);
      return false;
    }
  };

  const handleWorkflowDelete = async (id: string) => {
    console.log('App: Deleting workflow:', id);
    try {
      await api.deleteWorkflow(id);
      console.log('App: Workflow deleted successfully');
      setWorkflows(prev => prev.filter(w => w._id !== id));
      if (editingWorkflow?._id === id) {
        setEditingWorkflow(null); // Reset editing state if the deleted workflow was being edited
      }
    } catch (error) {
      console.error('App: Error deleting workflow:', error);
    }
  };

  const handleWorkflowEdit = (workflow: Workflow) => {
    console.log('App: Loading workflow for editing:', workflow);
    setEditingWorkflow(workflow);
  };

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    // This will trigger the useEffect in WorkflowCanvas to reset the state
  };

  const handleStartRecording = async () => {
    if (browserProfiles.length === 0) {
      alert('No browser profiles found. Please create a browser profile first by going to the "Profiles" tab.');
      setCurrentTab(4); // Switch to the Profiles tab (index 4)
      return;
    }

    // Show profile selection dialog
    setIsProfileDialogOpen(true);
  };

  const handleProfileSelect = async (profile: BrowserProfile) => {
    setIsProfileDialogOpen(false);
    setIsRecording(true);

    try {
      const response = await api.startCodegenRecording(profile._id);
      setIsRecording(false);

      // If recording completed successfully and created a new workflow
      if (response.workflowId) {
        // Load the newly created workflow
        const newWorkflow = await api.getWorkflow(response.workflowId);
        setEditingWorkflow(newWorkflow);
        
        // Show success message with Snackbar
        setSnackbar({
          open: true,
          message: 'Recording completed successfully! Your workflow has been created and is ready to edit.',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setSnackbar({
        open: true,
        message: 'Failed to start recording. Please try again.',
        severity: 'error'
      });
      setIsRecording(false);
    }
  };

  const handleProfileAdd = async (profile: Omit<BrowserProfile, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProfile = await api.createBrowserProfile(profile);
      setBrowserProfiles(prev => [...prev, newProfile]);
    } catch (error) {
      console.error('Error creating browser profile:', error);
    }
  };

  const handleProfileEdit = async (_id: string, profile: Partial<BrowserProfile>) => {
    try {
      const updatedProfile = await api.updateBrowserProfile(_id, profile);
      setBrowserProfiles(prev => prev.map(p => p._id === _id ? updatedProfile : p));
    } catch (error) {
      console.error('Error updating browser profile:', error);
    }
  };

  const handleProfileDelete = async (_id: string) => {
    try {
      await api.deleteBrowserProfile(_id);
      setBrowserProfiles(prev => prev.filter(p => p._id !== _id));
    } catch (error) {
      console.error('Error deleting browser profile:', error);
    }
  };

  const handleProfileDuplicate = async (_id: string) => {
    try {
      const profile = browserProfiles.find(p => p._id === _id);
      if (profile) {
        const { _id, createdAt, updatedAt, ...profileData } = profile;
        const newProfile = await api.createBrowserProfile({
          ...profileData,
          name: `${profileData.name} (Copy)`,
        });
        setBrowserProfiles(prev => [...prev, newProfile]);
      }
    } catch (error) {
      console.error('Error duplicating browser profile:', error);
    }
  };

  const handleExecutionStart = async (workflowId: string, profileId: string, parallel: boolean) => {
    try {
      const newExecution = await api.startExecution(workflowId, profileId, parallel);
      setExecutions(prev => [...prev, newExecution]);
      updateExecutionStats([...executions, newExecution]);
    } catch (error) {
      console.error('Failed to start execution:', error);
    }
  };

  const handleExecutionPause = async (executionId: string) => {
    try {
      await api.pauseExecution(executionId);
      setExecutions(prev => prev.map(e => 
        e._id === executionId ? { ...e, status: 'paused' } : e
      ));
    } catch (error) {
      console.error('Failed to pause execution:', error);
    }
  };

  const handleExecutionResume = async (executionId: string) => {
    try {
      await api.resumeExecution(executionId);
      setExecutions(prev => prev.map(e => 
        e._id === executionId ? { ...e, status: 'running' } : e
      ));
    } catch (error) {
      console.error('Failed to resume execution:', error);
    }
  };

  const handleExecutionStop = async (executionId: string) => {
    try {
      await api.stopExecution(executionId);
      setExecutions(prev => prev.map(e => 
        e._id === executionId ? { ...e, status: 'stopped' } : e
      ));
    } catch (error) {
      console.error('Failed to stop execution:', error);
    }
  };

  // Task management handlers
  const handleTaskAdd = async (task: TaskFormData) => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      const newTask = await response.json();
      // Update local state immediately
      setTasks(prevTasks => [...prevTasks, newTask]);
      // Refresh tasks to ensure consistency
      await loadTasks();
      // Show success message
      setSnackbar({
        open: true,
        message: 'Task created successfully',
        severity: 'success'
      });
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create task',
        severity: 'error'
      });
      return null;
    }
  };

  const handleTaskEdit = async (id: string, task: TaskFormData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      if (response.ok) {
        // Refresh tasks list
        loadTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Refresh tasks list
        loadTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskStart = async (id: string) => {
    try {
      // Find the task to get its workflow and profile IDs
      const task = tasks.find(t => t._id === id);
      if (!task) {
        throw new Error('Task not found');
      }

      // Start a new execution for this task
      await handleExecutionStart(task.workflowId, task.profileId, task.parallelExecution);
      
      // Update task status
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Refresh tasks list
      await loadTasks();
      // Refresh executions list
      await loadExecutions();

      setSnackbar({
        open: true,
        message: 'Task started successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error starting task:', error);
      setSnackbar({
        open: true,
        message: 'Failed to start task',
        severity: 'error'
      });
    }
  };

  const handleTaskPause = async (id: string) => {
    try {
      // Find the latest execution for this task
      const task = tasks.find(t => t._id === id);
      if (!task) {
        throw new Error('Task not found');
      }

      const taskExecution = executions.find(e => 
        e.workflowId === task.workflowId && 
        e.profileId === task.profileId && 
        e.status === 'running'
      );

      if (taskExecution) {
        await handleExecutionPause(taskExecution._id);
      }

      // Update task status
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/pause`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Refresh tasks list
      await loadTasks();
      // Refresh executions list
      await loadExecutions();

      setSnackbar({
        open: true,
        message: 'Task paused successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error pausing task:', error);
      setSnackbar({
        open: true,
        message: 'Failed to pause task',
        severity: 'error'
      });
    }
  };

  const handleTaskStop = async (id: string) => {
    try {
      // Find the latest execution for this task
      const task = tasks.find(t => t._id === id);
      if (!task) {
        throw new Error('Task not found');
      }

      const taskExecution = executions.find(e => 
        e.workflowId === task.workflowId && 
        e.profileId === task.profileId && 
        (e.status === 'running' || e.status === 'paused')
      );

      if (taskExecution) {
        await handleExecutionStop(taskExecution._id);
      }

      // Update task status
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Refresh tasks list
      await loadTasks();
      // Refresh executions list
      await loadExecutions();

      setSnackbar({
        open: true,
        message: 'Task stopped successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error stopping task:', error);
      setSnackbar({
        open: true,
        message: 'Failed to stop task',
        severity: 'error'
      });
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }
      const tasks = await response.json();
      setTasks(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load tasks',
        severity: 'error'
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar sx={{ px: 3, py: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box component="span" sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: 1, 
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}>
                W
              </Box>
              Web Automation Platform
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStartRecording}
                disabled={isRecording}
                startIcon={<PlayArrowIcon />}
              >
                {isRecording ? 'Recording...' : 'Record New Workflow'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              px: 2,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab label="Workflows" />
            <Tab label="Tasks" />
            <Tab label="Executions" />
            <Tab label="History" />
            <Tab label="Profiles" />
            <Tab label="Matrix" />
          </Tabs>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <TabPanel value={currentTab} index={0}>
              <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                <Box sx={{ width: 300, flexShrink: 0 }}>
                  <WorkflowList
                    workflows={workflows}
                    onEdit={handleWorkflowEdit}
                    onDelete={handleWorkflowDelete}
                    onCreateNew={handleCreateNew}
                    onExecute={async (workflow) => {
                      const taskData: TaskFormData = {
                        workflowId: workflow._id,
                        profileId: browserProfiles[0]?._id || '',
                        name: `Task ${tasks.length + 1}`,
                        description: '',
                        priority: 'medium',
                        schedule: {
                          type: 'once',
                          startDate: new Date().toISOString(),
                          time: new Date().toLocaleTimeString('en-US', { hour12: false })
                        },
                        maxRetries: 3,
                        timeout: 30000,
                        parallelExecution: false,
                      };
                      const newTask = await handleTaskAdd(taskData);
                      if (newTask && '_id' in newTask) {
                        await handleTaskStart(newTask._id);
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <WorkflowCanvas
                    workflow={editingWorkflow}
                    initialWorkflow={editingWorkflow}
                    onSave={handleWorkflowSave}
                    key={editingWorkflow?._id || 'new-workflow'}
                  />
                </Box>
                <Box sx={{ width: 250, flexShrink: 0 }}>
                  <NodePalette />
                </Box>
              </Box>
            </TabPanel>
            <TabPanel value={currentTab} index={1}>
              <TaskManager
                tasks={tasks}
                workflows={workflows}
                profiles={browserProfiles}
                onAdd={handleTaskAdd}
                onEdit={handleTaskEdit}
                onDelete={handleTaskDelete}
                onStart={handleTaskStart}
                onPause={handleTaskPause}
                onStop={handleTaskStop}
                onRefresh={loadTasks}
              />
            </TabPanel>
            <TabPanel value={currentTab} index={2}>
              <ExecutionPanel
                executions={executions}
                stats={executionStats}
                onStart={handleExecutionStart}
                onPause={handleExecutionPause}
                onResume={handleExecutionResume}
                onStop={handleExecutionStop}
                onRefresh={loadExecutions}
              />
            </TabPanel>
            <TabPanel value={currentTab} index={3}>
              <TaskHistory
                executions={executions}
                onRefresh={loadExecutions}
                onExportLogs={async (taskId) => {
                  // Implement export logs functionality
                  console.log('Exporting logs for task:', taskId);
                }}
              />
            </TabPanel>
            <TabPanel value={currentTab} index={4}>
              <BrowserProfileManager
                profiles={browserProfiles}
                onAdd={handleProfileAdd}
                onEdit={handleProfileEdit}
                onDelete={handleProfileDelete}
                onDuplicate={handleProfileDuplicate}
              />
            </TabPanel>
            <TabPanel value={currentTab} index={5}>
              <WorkflowProfileMatrix
                workflows={workflows}
                profiles={browserProfiles}
                onTaskCreate={async (task: TaskFormData) => {
                  await handleTaskAdd(task);
                }}
                onTaskExecute={async (workflowId: string, profileId: string) => {
                  const taskData: TaskFormData = {
                    workflowId,
                    profileId,
                    name: `Task ${tasks.length + 1}`,
                    description: '',
                    priority: 'medium',
                    schedule: {
                      type: 'once',
                      startDate: new Date().toISOString(),
                      time: new Date().toLocaleTimeString('en-US', { hour12: false })
                    },
                    maxRetries: 3,
                    timeout: 30000,
                    parallelExecution: false,
                  };
                  const newTask = await handleTaskAdd(taskData);
                  if (newTask && '_id' in newTask) {
                    await handleTaskStart(newTask._id);
                  }
                }}
              />
            </TabPanel>
          </Box>
        </Box>

        <ProfileSelectionDialog
          open={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          onSelect={handleProfileSelect}
          profiles={browserProfiles}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
