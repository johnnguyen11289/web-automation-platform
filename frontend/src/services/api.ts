import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/workflow';

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  status: 'active' | 'inactive';
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: any;
    connections: string[];
  }>;
}

export const api = {
  async createWorkflow(workflow: Omit<Workflow, '_id' | 'createdAt'>): Promise<Workflow> {
    console.log('API: Creating workflow:', workflow);
    try {
      const response = await axios.post(`${API_BASE_URL}`, workflow);
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
      const response = await axios.get(`${API_BASE_URL}`);
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
      const response = await axios.get(`${API_BASE_URL}/${id}`);
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
      const response = await axios.put(`${API_BASE_URL}/${id}`, workflow);
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
      await axios.delete(`${API_BASE_URL}/${id}`);
      console.log('API: Workflow deleted successfully');
    } catch (error) {
      console.error('API: Error deleting workflow:', error);
      throw error;
    }
  }
}; 