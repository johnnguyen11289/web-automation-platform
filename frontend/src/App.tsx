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
import WorkflowEditor from './components/WorkflowEditor/WorkflowEditor';
import ExecutionPanel from './components/ExecutionPanel/ExecutionPanel';
import TaskHistory from './components/TaskHistory/TaskHistory';
import BrowserProfileManager from './components/BrowserProfile/BrowserProfileManager';

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [workflows] = useState([]);
  const [activeExecutions] = useState([]);
  const [taskHistory] = useState([]);
  const [browserProfiles] = useState([]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Web Automation Platform
            </Typography>
          </Toolbar>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="navigation tabs"
            sx={{ bgcolor: 'background.paper' }}
          >
            <Tab label="Workflows" />
            <Tab label="Execution" />
            <Tab label="History" />
            <Tab label="Browser Profiles" />
          </Tabs>
        </AppBar>

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
                <WorkflowEditor
                  workflow={{
                    id: '1',
                    name: 'New Workflow',
                    nodes: [],
                    edges: [],
                  }}
                  onSave={() => {}}
                />
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
