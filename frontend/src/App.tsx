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
import WorkflowCanvas from './components/WorkflowCanvas';
import NodePalette from './components/NodePalette';
import { api, Workflow } from './services/api';
import './App.css';
import { BrowserProfile } from './types/browser.types';

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
  const [activeExecutions, setActiveExecutions] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [browserProfiles, setBrowserProfiles] = useState<BrowserProfile[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    loadWorkflows();
    loadBrowserProfiles();
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

  const handleProfileAdd = async (profile: Omit<BrowserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProfile = await api.createBrowserProfile(profile);
      setBrowserProfiles(prev => [...prev, newProfile]);
    } catch (error) {
      console.error('Error creating browser profile:', error);
    }
  };

  const handleProfileEdit = async (id: string, profile: Partial<BrowserProfile>) => {
    try {
      const updatedProfile = await api.updateBrowserProfile(id, profile);
      setBrowserProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p));
    } catch (error) {
      console.error('Error updating browser profile:', error);
    }
  };

  const handleProfileDelete = async (id: string) => {
    try {
      await api.deleteBrowserProfile(id);
      setBrowserProfiles(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting browser profile:', error);
    }
  };

  const handleProfileDuplicate = async (id: string) => {
    try {
      const profile = browserProfiles.find(p => p.id === id);
      if (profile) {
        const { id: _, createdAt, updatedAt, ...profileData } = profile;
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
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <ExecutionPanel
              activeExecutions={activeExecutions}
              onStart={() => {}}
              onStop={() => {}}
              onRefresh={() => {}}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <TaskHistory
              executions={taskHistory}
              onRefresh={() => {}}
              onExportLogs={() => {}}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
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
