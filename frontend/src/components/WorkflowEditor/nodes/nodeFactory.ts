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
  OpenUrlNodeData,
  VariableManagerNodeData,
  SubtitleToVoiceNodeData,
  EditVideoNodeData
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
  variableManager: '#00acc1', // Light Blue
  subtitleToVoice: '#ff4081', // Pink A200
  editVideo: '#7c4dff',  // Deep Purple A200
};

export const createNode = (
  type: string,
  position: { x: number; y: number },
  label?: string
): Node<WorkflowNodeData> => {
  const baseData = {
    type,
    label: label || type.charAt(0).toUpperCase() + type.slice(1),
    waitForSelector: '',
    waitForSelectorRemoval: '',
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

    case 'variableManager': {
      const data: VariableManagerNodeData = {
        ...baseData,
        operations: [
          {
            action: 'set',
            key: 'businessType',
            value: '',
            type: 'string'
          }
        ],
        scope: 'local',
        persist: false,
        initializeWith: {
          businessType: ''  // Will be populated from BrowserProfile
        }
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'subtitleToVoice': {
      const data: SubtitleToVoiceNodeData = {
        ...baseData,
        language: 'en',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        splitByLine: false,
        preserveTimings: true,
      };
      return { id: `${type}-${Date.now()}`, type, position, data };
    }

    case 'editVideo': {
      const data: EditVideoNodeData = {
        ...baseData,
        inputPath: '',
        operations: [],
        format: 'mp4',
        quality: 100,
        preserveAudio: true,
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