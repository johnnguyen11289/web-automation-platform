import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const response = await axios.post(`${API_BASE_URL}/workflows`, workflow);
    return response.data;
  },

  async getWorkflows(): Promise<Workflow[]> {
    const response = await axios.get(`${API_BASE_URL}/workflows`);
    return response.data;
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await axios.get(`${API_BASE_URL}/workflows/${id}`);
    return response.data;
  },

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const response = await axios.put(`${API_BASE_URL}/workflows/${id}`, workflow);
    return response.data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/workflows/${id}`);
  }
}; 