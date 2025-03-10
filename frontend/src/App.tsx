import React, { useState } from 'react';
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'active' | 'inactive';
  nodes: any[];
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeExecutions, setActiveExecutions] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [browserProfiles, setBrowserProfiles] = useState([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleWorkflowSave = async (workflow: { nodes: any[]; name: string; description?: string }) => {
    try {
      // Here you would typically make an API call to save the workflow
      // For now, we'll just update the local state
      const newWorkflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: workflow.name,
        description: workflow.description || '',
        createdAt: new Date().toISOString(),
        status: 'active',
        nodes: workflow.nodes,
      };

      setWorkflows(prev => [...prev, newWorkflow]);
      return true;
    } catch (error) {
      console.error('Error saving workflow:', error);
      return false;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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

        <Container maxWidth="xl">
          <TabPanel value={currentTab} index={0}>
            <Box display="flex" gap={2}>
              <Box flex={1}>
                <WorkflowList
                  workflows={workflows}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onExecute={() => {}}
                />
              </Box>
              <Box flex={2}>
                <div className="editor-container">
                  <NodePalette />
                  <WorkflowCanvas onSave={handleWorkflowSave} />
                </div>
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
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
