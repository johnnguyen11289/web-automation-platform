import { AutomationAction } from '../services/automation.service';

export interface NodeOutput {
  value: any;
  type: 'text' | 'number' | 'boolean' | 'array' | 'object';
}

export interface NodeDataBase {
  label: string;
  type: string;
  id: string;
  outputs?: Record<string, NodeOutput>;
  variableReferences?: Record<string, string>;
}

export interface ClickNodeData extends NodeDataBase {
  selector: string;
  timeout?: number;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
}

export interface InputNodeData extends NodeDataBase {
  selector: string;
  value: string;
  timeout?: number;
  clearFirst?: boolean;
}

export interface SubmitNodeData extends NodeDataBase {
  selector: string;
  timeout?: number;
  waitForNavigation?: boolean;
}

export interface WaitNodeData extends NodeDataBase {
  type: 'wait';
  condition: 'delay' | 'element' | 'networkIdle';
  timeout?: number;
  selector?: string;
  delay?: number;
}

export interface ConditionNodeData extends NodeDataBase {
  selector: string;
  condition: 'exists' | 'visible' | 'text' | 'attribute';
  value?: string;
  attribute?: string;
  timeout?: number;
}

export interface LoopNodeData extends NodeDataBase {
  selector: string;
  condition: 'while' | 'forEach';
  maxIterations?: number;
  timeout?: number;
  items?: string; // Variable reference
}

export interface ExtractNodeData extends NodeDataBase {
  selector: string;
  extractType: 'text' | 'attribute' | 'innerHTML' | 'list';
  attribute?: string;
  variableName: string;
  timeout?: number;
}

export interface OpenUrlNodeData extends NodeDataBase {
  url: string;
  waitForLoad?: boolean;
  timeout?: number;
}

export type WorkflowNodeData = 
  | ClickNodeData 
  | InputNodeData 
  | SubmitNodeData 
  | WaitNodeData 
  | ConditionNodeData 
  | LoopNodeData 
  | ExtractNodeData 
  | OpenUrlNodeData;

export interface WorkflowNode {
  id: string;
  type: string;
  data: WorkflowNodeData;
  position: { x: number; y: number };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowFormData {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
  }>;
}

// Helper function to convert workflow node to automation actions
export function convertNodeToActions(node: WorkflowNode): AutomationAction[] {
  const actions: AutomationAction[] = [];
  const data = node.data;

  switch (data.type) {
    case 'click':
      actions.push({
        type: 'click',
        selector: (data as ClickNodeData).selector
      });
      break;
    case 'input':
      actions.push({
        type: 'type',
        selector: (data as InputNodeData).selector,
        value: (data as InputNodeData).value
      });
      break;
    case 'wait':
      actions.push({
        type: 'wait',
        selector: (data as WaitNodeData).selector
      });
      break;
    // Add more cases as needed
  }

  return actions;
} 