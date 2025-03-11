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

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
  const [currentTab, setCurrentTab] = useState(0);
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

    // Use the first profile for now
    const profile = browserProfiles[0];
    try {
      await api.startCodegenRecording(profile._id);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please try again.');
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
      if (response.ok) {
        const newTask = await response.json();
        // Refresh tasks list
        loadTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
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
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/start`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh tasks list
        loadTasks();
      }
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handleTaskPause = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/pause`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh tasks list
        loadTasks();
      }
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  };

  const handleTaskStop = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}/stop`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh tasks list
        loadTasks();
      }
    } catch (error) {
      console.error('Error stopping task:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      if (response.ok) {
        const tasks = await response.json();
        // Update tasks state
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div">
              Web Automation Platform
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Workflows" />
            <Tab label="Tasks" />
            <Tab label="Execution" />
            <Tab label="History" />
            <Tab label="Profiles" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={currentTab} index={0}>
            <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
              <Box sx={{ width: '300px', overflow: 'auto' }}>
                <WorkflowList
                  workflows={workflows}
                  onEdit={handleWorkflowEdit}
                  onDelete={handleWorkflowDelete}
                  onExecute={() => {}}
                />
              </Box>
              <Box sx={{ flex: 1, height: '100%', display: 'flex' }}>
                <Box sx={{ width: '200px', borderRight: 1, borderColor: 'divider' }}>
                  <NodePalette />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <WorkflowCanvas 
                    onSave={handleWorkflowSave}
                    initialWorkflow={editingWorkflow}
                    onCreateNew={handleCreateNew}
                    onStartRecording={handleStartRecording}
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <WorkflowProfileMatrix
                workflows={workflows}
                profiles={browserProfiles}
                onTaskCreate={handleTaskAdd}
                onTaskExecute={(workflowId, profileId) => handleExecutionStart(workflowId, profileId, false)}
              />
              <TaskManager
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
            </Box>
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
              executions={taskHistory}
              onRefresh={() => {}}
              onExportLogs={() => {}}
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
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
