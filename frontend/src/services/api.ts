import axios from 'axios';
import { BrowserProfile } from '../types/browser.types';
import { Execution } from '../types/execution.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

export const api = {
  async createWorkflow(workflow: Omit<Workflow, '_id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    console.log('API: Creating workflow:', workflow);
    try {
      const response = await axios.post(`${API_BASE_URL}/workflows`, workflow);
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
      const response = await axios.get(`${API_BASE_URL}/workflows`);
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
      const response = await axios.get(`${API_BASE_URL}/workflows/${id}`);
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
      const response = await axios.put(`${API_BASE_URL}/workflows/${id}`, workflow);
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
      await axios.delete(`${API_BASE_URL}/workflows/${id}`);
      console.log('API: Workflow deleted successfully');
    } catch (error) {
      console.error('API: Error deleting workflow:', error);
      throw error;
    }
  },

  // Browser Profile methods
  createBrowserProfile: async (profile: Omit<BrowserProfile, '_id' | 'createdAt' | 'updatedAt'>): Promise<BrowserProfile> => {
    console.log('API: Creating browser profile:', profile);
    console.log('API: Business Type value:', profile.businessType);
    try {
      // Ensure all properties are included in the payload
      const payload = {
        name: profile.name,
        browserType: profile.browserType,
        userAgent: profile.userAgent,
        isHeadless: profile.isHeadless,
        proxy: profile.proxy,
        viewport: profile.viewport,
        cookies: profile.cookies,
        localStorage: profile.localStorage,
        sessionStorage: profile.sessionStorage,
        startupScript: profile.startupScript,
        useLocalChrome: profile.useLocalChrome,
        userDataDir: profile.userDataDir,
        locale: profile.locale,
        timezone: profile.timezone,
        geolocation: profile.geolocation,
        permissions: profile.permissions,
        customJs: profile.customJs,
        businessType: profile.businessType,
      };
      console.log('API: Sending payload with businessType:', payload.businessType);
      const response = await axios.post(`${API_BASE_URL}/browser-profiles`, payload);
      console.log('API: Profile created successfully. Response data:', response.data);
      console.log('API: Business Type in response:', response.data.businessType);
      return response.data;
    } catch (error) {
      console.error('API: Error creating browser profile:', error);
      throw new Error('Failed to create browser profile');
    }
  },

  getBrowserProfiles: async (): Promise<BrowserProfile[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/browser-profiles`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching browser profiles:', error);
      throw new Error('Failed to fetch browser profiles');
    }
  },

  updateBrowserProfile: async (_id: string, profile: Partial<BrowserProfile>): Promise<BrowserProfile> => {
    console.log('API: Updating browser profile:', { _id, profile });
    console.log('API: Business Type value in update:', profile.businessType);
    try {
      const payload = {
        ...(profile.name !== undefined && { name: profile.name }),
        ...(profile.browserType !== undefined && { browserType: profile.browserType }),
        ...(profile.userAgent !== undefined && { userAgent: profile.userAgent }),
        ...(profile.isHeadless !== undefined && { isHeadless: profile.isHeadless }),
        ...(profile.proxy !== undefined && { proxy: profile.proxy }),
        ...(profile.viewport !== undefined && { viewport: profile.viewport }),
        ...(profile.cookies !== undefined && { cookies: profile.cookies }),
        ...(profile.localStorage !== undefined && { localStorage: profile.localStorage }),
        ...(profile.sessionStorage !== undefined && { sessionStorage: profile.sessionStorage }),
        ...(profile.startupScript !== undefined && { startupScript: profile.startupScript }),
        ...(profile.useLocalChrome !== undefined && { useLocalChrome: profile.useLocalChrome }),
        ...(profile.userDataDir !== undefined && { userDataDir: profile.userDataDir }),
        ...(profile.locale !== undefined && { locale: profile.locale }),
        ...(profile.timezone !== undefined && { timezone: profile.timezone }),
        ...(profile.geolocation !== undefined && { geolocation: profile.geolocation }),
        ...(profile.permissions !== undefined && { permissions: profile.permissions }),
        ...(profile.customJs !== undefined && { customJs: profile.customJs }),
        ...(profile.businessType !== undefined && { businessType: profile.businessType }),
      };
      console.log('API: Sending update payload with businessType:', payload.businessType);
      const response = await axios.put(`${API_BASE_URL}/browser-profiles/${_id}`, payload);
      console.log('API: Profile updated successfully. Response data:', response.data);
      console.log('API: Business Type in response:', response.data.businessType);
      return response.data;
    } catch (error) {
      console.error('API: Error updating browser profile:', error);
      throw new Error('Failed to update browser profile');
    }
  },

  deleteBrowserProfile: async (_id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/browser-profiles/${_id}`);
    } catch (error) {
      console.error('API: Error deleting browser profile:', error);
      throw new Error('Failed to delete browser profile');
    }
  },

  openBrowserProfile: async (_id: string, options?: { forceChromium?: boolean }): Promise<void> => {
    console.log('API: Opening browser profile:', { _id, options });
    try {
      // Don't send forceChromium option when we want to use local Chrome
      const payload = options?.forceChromium ? { forceChromium: true } : {};
      console.log('API: Opening browser with payload:', payload);
      
      const response = await axios.post(`${API_BASE_URL}/browser-profiles/${_id}/open`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status !== 200) {
        console.error('API: Failed to open browser profile:', {
          status: response.status,
          data: response.data,
        });
        throw new Error('Failed to open browser profile');
      }
      
      console.log('API: Browser profile opened successfully:', {
        status: response.status,
        data: response.data,
        useLocalChrome: !options?.forceChromium,
      });
    } catch (error: any) {
      console.error('API: Error opening browser profile:', {
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw new Error(error?.response?.data?.message || 'Failed to open browser profile');
    }
  },

  // Execution methods
  getExecutions: async (): Promise<Execution[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/executions`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching executions:', error);
      throw new Error('Failed to fetch executions');
    }
  },

  startExecution: async (workflowId: string, profileId: string, parallel: boolean): Promise<Execution> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/executions`, {
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
      await axios.post(`${API_BASE_URL}/executions/${executionId}/pause`);
    } catch (error) {
      console.error('API: Error pausing execution:', error);
      throw new Error('Failed to pause execution');
    }
  },

  resumeExecution: async (executionId: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/executions/${executionId}/resume`);
    } catch (error) {
      console.error('API: Error resuming execution:', error);
      throw new Error('Failed to resume execution');
    }
  },

  stopExecution: async (executionId: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/executions/${executionId}/stop`);
    } catch (error) {
      console.error('API: Error stopping execution:', error);
      throw new Error('Failed to stop execution');
    }
  },

  // Recording methods
  startCodegenRecording: async (profileId: string): Promise<{ workflowId: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/recording/codegen/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error starting codegen recording:', error);
      throw new Error('Failed to start recording');
    }
  },
}; 