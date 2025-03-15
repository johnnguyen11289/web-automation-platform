import { Node } from 'reactflow';

// Variable reference format: ${variableName}
export type VariableReference = string;

export interface NodeOutput {
  value: any;
  type: 'text' | 'number' | 'boolean' | 'array' | 'object';
}

export type NodeDataBase = {
  label: string;
  type: string;
  id?: string;
  outputs?: Record<string, NodeOutput>;
  // Allow any field to reference a variable
  variableReferences?: Record<string, VariableReference>;
};

export interface ClickNodeData extends NodeDataBase {
  selector: string;
  timeout?: number;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  outputs?: {
    success: NodeOutput;
  };
}

export interface InputNodeData extends NodeDataBase {
  selector: string;
  value: string;
  timeout?: number;
  clearFirst?: boolean;
  outputs?: {
    success: NodeOutput;
  };
}

export interface SubmitNodeData extends NodeDataBase {
  selector: string;
  timeout?: number;
  waitForNavigation?: boolean;
  outputs?: {
    success: NodeOutput;
  };
}

export interface WaitNodeData extends NodeDataBase {
  type: 'wait';
  condition: 'delay' | 'element' | 'networkIdle';
  timeout?: number;
  selector?: string;
  delay?: number;
  outputs?: {
    success: NodeOutput;
  };
}

export interface ConditionNodeData extends NodeDataBase {
  selector: string;
  condition: 'exists' | 'visible' | 'text' | 'attribute';
  value?: string;
  attribute?: string;
  timeout?: number;
  outputs?: {
    true: NodeOutput;
    false: NodeOutput;
  };
}

export interface LoopNodeData extends NodeDataBase {
  selector: string;
  condition: 'while' | 'forEach';
  maxIterations?: number;
  timeout?: number;
  // For forEach loops, this can reference an array from a previous node
  items?: VariableReference;
  outputs?: {
    currentItem: NodeOutput;
    index: NodeOutput;
    completed: NodeOutput;
  };
}

export interface ExtensionNodeData extends NodeDataBase {
  extensionId: string;
  action: string;
  parameters: Record<string, any>;
  outputs?: {
    result: NodeOutput;
  };
}

export interface VariableNodeData extends NodeDataBase {
  name: string;
  value: string | VariableReference;
  scope: 'local' | 'global';
  outputs?: {
    value: NodeOutput;
  };
}

export interface ExtractNodeData extends NodeDataBase {
  selector: string;
  extractType: 'text' | 'attribute' | 'innerHTML' | 'list';
  attribute?: string;
  variableName: string;
  timeout?: number;
  outputs?: {
    extractedValue: NodeOutput;
    success: NodeOutput;
  };
}

export interface ProfileNodeData extends NodeDataBase {
  profileId: string;
  outputs?: {
    success: NodeOutput;
  };
}

export interface OpenUrlNodeData extends NodeDataBase {
  url: string;
  waitForLoad?: boolean;
  timeout?: number;
  outputs?: {
    success: NodeOutput;
    pageTitle: NodeOutput;
    pageUrl: NodeOutput;
  };
}

export interface VariableManagerNodeData extends NodeDataBase {
  operations: Array<{
    action: 'set' | 'update' | 'delete' | 'increment' | 'decrement' | 'concat' | 'clear';
    key: string;
    value?: string | number | boolean | null;
    expression?: string;
    type?: 'string' | 'number' | 'boolean' | 'json' | 'array';
    source?: string;
  }>;
  scope?: 'local' | 'global' | 'flow';
  persist?: boolean;
  initializeWith?: Record<string, any>;
  outputs?: {
    success: NodeOutput;
    variables: NodeOutput;
  };
}

export interface SubtitleToVoiceNodeData extends NodeDataBase {
  subtitleFile?: string;
  subtitleFormat?: 'srt' | 'vtt' | 'ass';
  language: string;
  voice?: string;
  outputPath?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  splitByLine?: boolean;
  preserveTimings?: boolean;
  outputs?: {
    success: NodeOutput;
    outputPath: NodeOutput;
  };
}

export interface EditVideoNodeData extends NodeDataBase {
  inputPath: string;
  outputPath?: string;
  operations: Array<{
    type: 'trim' | 'crop' | 'resize' | 'overlay' | 'merge' | 'addAudio' | 'speed' | 'filter';
    params: {
      start?: number;
      end?: number;
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      path?: string;
      speed?: number;
      filter?: string;
      [key: string]: any;
    };
  }>;
  format?: string;
  quality?: number;
  preserveAudio?: boolean;
  audioTrack?: string;
  outputs?: {
    success: NodeOutput;
    outputPath: NodeOutput;
  };
}

export type WorkflowNodeData = 
  | ClickNodeData 
  | InputNodeData 
  | SubmitNodeData 
  | WaitNodeData 
  | ConditionNodeData 
  | LoopNodeData 
  | ExtensionNodeData 
  | VariableNodeData 
  | ExtractNodeData 
  | ProfileNodeData
  | OpenUrlNodeData
  | VariableManagerNodeData
  | SubtitleToVoiceNodeData
  | EditVideoNodeData;

export type WorkflowNode = Node<WorkflowNodeData>;

// Helper type for node configuration dialogs
export interface NodeConfig<T extends WorkflowNodeData> {
  nodeId: string;
  data: T;
  onChange: (newData: T) => void;
}

// Runtime value management
export interface RuntimeValue {
  type: 'text' | 'number' | 'boolean' | 'array' | 'object';
  value: any;
  timestamp: number;
  sourceNodeId: string;
  outputKey: string;
}

export interface WorkflowContext {
  variables: Record<string, RuntimeValue>;
  getVariable: (reference: VariableReference) => RuntimeValue | undefined;
  setVariable: (name: string, value: RuntimeValue) => void;
} 