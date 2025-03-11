import axios from 'axios';
import { BrowserProfile } from '../types/browser.types';
import { Execution } from '../types/execution.types';
import { config } from '../config/config';

const api = axios.create({
    baseURL: config.api.baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  properties: any;
  connections: string[];
}

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  nodes: WorkflowNode[];
  createdAt: Date;
  updatedAt: Date;
}

export const apiService = {
  async createWorkflow(workflow: Omit<Workflow, '_id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    console.log('API: Creating workflow:', workflow);
    try {
      const response = await api.post('/workflows', workflow);
      console.log('API: Workflow created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error creating workflow:', error);
      throw error;
    }
  },

  async getWorkflows(): Promise<Workflow[]> {
    console.log('API: Fetching workflows');
    try {
      const response = await api.get('/workflows');
      console.log('API: Workflows fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching workflows:', error);
      throw error;
    }
  },

  async getWorkflow(id: string): Promise<Workflow> {
    console.log('API: Fetching workflow:', id);
    try {
      const response = await api.get(`/workflows/${id}`);
      console.log('API: Workflow fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching workflow:', error);
      throw error;
    }
  },

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    console.log('API: Updating workflow:', id, workflow);
    try {
      const response = await api.put(`/workflows/${id}`, workflow);
      console.log('API: Workflow updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error updating workflow:', error);
      throw error;
    }
  },

  async deleteWorkflow(id: string): Promise<void> {
    console.log('API: Deleting workflow:', id);
    try {
      await api.delete(`/workflows/${id}`);
      console.log('API: Workflow deleted successfully');
    } catch (error) {
      console.error('API: Error deleting workflow:', error);
      throw error;
    }
  },

  // Browser Profile methods
  createBrowserProfile: async (profile: Omit<BrowserProfile, '_id' | 'createdAt' | 'updatedAt'>): Promise<BrowserProfile> => {
    try {
      const response = await api.post('/browser-profiles', profile);
      return response.data;
    } catch (error) {
      console.error('API: Error creating browser profile:', error);
      throw new Error('Failed to create browser profile');
    }
  },

  getBrowserProfiles: async (): Promise<BrowserProfile[]> => {
    try {
      const response = await api.get('/browser-profiles');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching browser profiles:', error);
      throw new Error('Failed to fetch browser profiles');
    }
  },

  updateBrowserProfile: async (_id: string, profile: Partial<BrowserProfile>): Promise<BrowserProfile> => {
    try {
      const response = await api.put(`/browser-profiles/${_id}`, profile);
      return response.data;
    } catch (error) {
      console.error('API: Error updating browser profile:', error);
      throw new Error('Failed to update browser profile');
    }
  },

  deleteBrowserProfile: async (_id: string): Promise<void> => {
    try {
      await api.delete(`/browser-profiles/${_id}`);
    } catch (error) {
      console.error('API: Error deleting browser profile:', error);
      throw new Error('Failed to delete browser profile');
    }
  },

  openBrowserProfile: async (_id: string): Promise<void> => {
    const url = `/browser-profiles/${_id}/open`;
    console.log('API: Opening browser profile:', { _id, url });
    try {
      await api.post(url);
      console.log('API: Browser profile opened successfully');
    } catch (error: any) {
      console.error('API: Error opening browser profile:', {
        message: error?.message,
        url,
        baseUrl: config.api.baseURL,
        status: error?.response?.status,
        data: error?.response?.data
      });
      throw new Error('Failed to open browser profile');
    }
  },

  // Execution methods
  getExecutions: async (): Promise<Execution[]> => {
    try {
      const response = await api.get('/executions');
      return response.data;
    } catch (error) {
      console.error('API: Error fetching executions:', error);
      throw new Error('Failed to fetch executions');
    }
  },

  startExecution: async (workflowId: string, profileId: string, parallel: boolean): Promise<Execution> => {
    try {
      const response = await api.post('/executions', {
        workflowId,
        profileId,
        parallel,
      });
      return response.data;
    } catch (error) {
      console.error('API: Error starting execution:', error);
      throw new Error('Failed to start execution');
    }
  },

  pauseExecution: async (executionId: string): Promise<void> => {
    try {
      await api.post(`/executions/${executionId}/pause`);
    } catch (error) {
      console.error('API: Error pausing execution:', error);
      throw new Error('Failed to pause execution');
    }
  },

  resumeExecution: async (executionId: string): Promise<void> => {
    try {
      await api.post(`/executions/${executionId}/resume`);
    } catch (error) {
      console.error('API: Error resuming execution:', error);
      throw new Error('Failed to resume execution');
    }
  },

  stopExecution: async (executionId: string): Promise<void> => {
    try {
      await api.post(`/executions/${executionId}/stop`);
    } catch (error) {
      console.error('API: Error stopping execution:', error);
      throw new Error('Failed to stop execution');
    }
  },

  // Recording methods
  startCodegenRecording: async (profileId: string): Promise<{ workflowId: string }> => {
    try {
      const response = await api.post(`/recording/codegen/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error starting codegen recording:', error);
      throw new Error('Failed to start recording');
    }
  },
};

export default apiService; 