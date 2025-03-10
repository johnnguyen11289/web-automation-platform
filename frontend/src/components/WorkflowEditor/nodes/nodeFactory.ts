import { Node } from 'reactflow';
import { 
  WorkflowNodeData,
  ClickNodeData,
  InputNodeData,
  SubmitNodeData,
  WaitNodeData,
  ConditionNodeData,
  LoopNodeData,
  ExtensionNodeData,
  VariableNodeData,
  ExtractNodeData,
  ProfileNodeData,
  OpenUrlNodeData
} from './types';

export const NODE_COLORS = {
  click: '#2196f3',      // Blue
  input: '#4caf50',      // Green
  submit: '#ff9800',     // Orange
  wait: '#9c27b0',      // Purple
  condition: '#f44336',  // Red
  loop: '#795548',      // Brown
  extension: '#607d8b',  // Blue Grey
  variable: '#009688',   // Teal
  extract: '#673ab7',    // Deep Purple
  profile: '#3f51b5',    // Indigo
  openUrl: '#00bcd4',    // Cyan
};

export const createNode = (
  type: string,
  position: { x: number; y: number },
  label?: string
): Node<WorkflowNodeData> => {
  const baseData = {
    type,
    label: label || type.charAt(0).toUpperCase() + type.slice(1),
  };

  switch (type) {
    case 'click': {
      const data: ClickNodeData = {
        ...baseData,
        selector: '',
        timeout: 5000,
        button: 'left',
        clickCount: 1,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'input': {
      const data: InputNodeData = {
        ...baseData,
        selector: '',
        value: '',
        timeout: 5000,
        clearFirst: true,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'submit': {
      const data: SubmitNodeData = {
        ...baseData,
        selector: '',
        timeout: 5000,
        waitForNavigation: true,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'wait': {
      const data: WaitNodeData = {
        ...baseData,
        type: 'wait',
        condition: 'delay',
        timeout: 5000,
        delay: 1000,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'condition': {
      const data: ConditionNodeData = {
        ...baseData,
        selector: '',
        condition: 'exists',
        timeout: 5000,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'loop': {
      const data: LoopNodeData = {
        ...baseData,
        selector: '',
        condition: 'while',
        maxIterations: 10,
        timeout: 5000,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'extension': {
      const data: ExtensionNodeData = {
        ...baseData,
        extensionId: '',
        action: '',
        parameters: {},
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'variable': {
      const data: VariableNodeData = {
        ...baseData,
        name: '',
        value: '',
        scope: 'local',
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'extract': {
      const data: ExtractNodeData = {
        ...baseData,
        selector: '',
        extractType: 'text',
        variableName: '',
        timeout: 5000,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'profile': {
      const data: ProfileNodeData = {
        ...baseData,
        profileId: '',
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'openUrl': {
      const data: OpenUrlNodeData = {
        ...baseData,
        url: '',
        waitForLoad: true,
        timeout: 30000,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    default: {
      return {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: baseData,
      } as Node<WorkflowNodeData>;
    }
  }
}; 