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
        <Box sx={{ p: 3, height: 'calc(100vh - 120px)' }}>
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
  const [browserProfiles, setBrowserProfiles] = useState([]);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleWorkflowSave = async (workflow: { nodes: any[]; name: string; description?: string }) => {
    try {
      const newWorkflow = await api.createWorkflow({
        name: workflow.name,
        description: workflow.description || '',
        status: 'active',
        nodes: workflow.nodes,
      });
      
      setWorkflows(prev => [...prev, newWorkflow]);
      return true;
    } catch (error) {
      console.error('Error saving workflow:', error);
      return false;
    }
  };

  const handleWorkflowDelete = async (id: string) => {
    try {
      await api.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w._id !== id));
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleWorkflowEdit = async (workflow: Workflow) => {
    try {
      const updatedWorkflow = await api.updateWorkflow(workflow._id, workflow);
      setWorkflows(prev => prev.map(w => w._id === workflow._id ? updatedWorkflow : w));
    } catch (error) {
      console.error('Error updating workflow:', error);
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
                  <WorkflowCanvas onSave={handleWorkflowSave} />
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
              onAdd={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onDuplicate={() => {}}
            />
          </TabPanel>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
