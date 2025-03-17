export type ErrorHandlingStrategy = 'retry' | 'skip' | 'stop';
export type VariableType = 'string' | 'number' | 'boolean' | 'json' | 'array';

export interface BaseNodeProperties {
  nodeName: string;
  nodeType: string;
  timeout?: number;
  enabled: boolean;
  errorHandling: ErrorHandlingStrategy;
  stopOnError?: boolean;
}

export interface OpenUrlNodeProperties extends BaseNodeProperties {
  nodeType: 'openUrl';
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  openInNewTab?: boolean;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface ClickNodeProperties extends BaseNodeProperties {
  nodeType: 'click';
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
  waitForNavigation?: boolean;
}

export interface TypeNodeProperties extends BaseNodeProperties {
  nodeType: 'type';
  selector: string;
  value: string;
  delay?: number;
  clearFirst?: boolean;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
  pressEnter?: boolean;
  variableOperations?: VariableOperation[];
}

export interface SelectNodeProperties extends BaseNodeProperties {
  nodeType: 'select';
  selector: string;
  value: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
  variableOperations?: VariableOperation[];
}

export interface WaitNodeProperties extends BaseNodeProperties {
  nodeType: 'wait';
  condition?: 'networkIdle' | 'delay' | 'selectorPresent' | 'selectorRemoved';
  delay?: number;
  selector?: string;
  timeout?: number;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface ExtractNodeProperties extends BaseNodeProperties {
  nodeType: 'extract';
  selector: string;
  attribute?: string;
  customAttribute?: string;
  key?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
  variableOperations?: VariableOperation[];
}

export interface EvaluateNodeProperties extends BaseNodeProperties {
  nodeType: 'evaluate';
  script: string;
  key?: string;
}

export interface KeyboardNodeProperties extends BaseNodeProperties {
  nodeType: 'keyboard';
  key: string;
  customKey?: string;
}

export interface FocusNodeProperties extends BaseNodeProperties {
  nodeType: 'focus';
  selector: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface HoverNodeProperties extends BaseNodeProperties {
  nodeType: 'hover';
  selector: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface ScreenshotNodeProperties extends BaseNodeProperties {
  nodeType: 'screenshot';
  path?: string;
  selector?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface ConditionNodeProperties extends BaseNodeProperties {
  nodeType: 'condition';
  conditionType: 'equals' | 'contains' | 'exists';
  targetVariable: string;
  selector?: string;
  truePath: string;
  falsePath: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface LoopNodeProperties extends BaseNodeProperties {
  nodeType: 'loop';
  loopType: 'fixed' | 'list';
  maxIterations: number;
  breakCondition?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface ScrollNodeProperties extends BaseNodeProperties {
  nodeType: 'scroll';
  selector?: string;
  direction?: 'up' | 'down' | 'intoView';
  amount?: number;
  smooth?: boolean;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface IframeNodeProperties extends BaseNodeProperties {
  nodeType: 'iframe';
  selector: string;
  action: 'switch' | 'switchBack';
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface AlertNodeProperties extends BaseNodeProperties {
  nodeType: 'alert';
  action: 'accept' | 'dismiss' | 'type';
  text?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface CookieNodeProperties extends BaseNodeProperties {
  nodeType: 'cookie';
  action: 'get' | 'set' | 'delete' | 'clear';
  name?: string;
  value?: string;
  key?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface StorageNodeProperties extends BaseNodeProperties {
  nodeType: 'storage';
  storageType: 'local' | 'session';
  action: 'get' | 'set' | 'remove' | 'clear';
  key?: string;
  value?: string;
  resultKey?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface FileUploadNodeProperties extends BaseNodeProperties {
  nodeType: 'fileUpload';
  selector: string;
  filePath: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
  variableOperations?: VariableOperation[];
}

export interface DragDropNodeProperties extends BaseNodeProperties {
  nodeType: 'dragDrop';
  sourceSelector: string;
  targetSelector: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface NetworkNodeProperties extends BaseNodeProperties {
  nodeType: 'network';
  action: 'block' | 'unblock' | 'intercept';
  urlPattern?: string;
  method?: string;
  response?: any;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface WalletConnectNodeProperties extends BaseNodeProperties {
  nodeType: 'walletConnect';
  action: 'connect' | 'disconnect';
  walletType: 'metamask' | 'phantom' | 'solflare' | 'walletconnect';
  network?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface WalletSignNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSign';
  action: 'signMessage' | 'signTransaction';
  message?: string;
  transaction?: any;
  key?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface WalletSendNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSend';
  action: 'sendTransaction';
  to: string;
  amount: string;
  token?: string;
  network?: string;
  key?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface WalletBalanceNodeProperties extends BaseNodeProperties {
  nodeType: 'walletBalance';
  action: 'getBalance';
  token?: string;
  network?: string;
  key?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface WalletApproveNodeProperties extends BaseNodeProperties {
  nodeType: 'walletApprove';
  action: 'approveToken';
  token: string;
  spender: string;
  amount: string;
  network?: string;
  key?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface WalletSwitchNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSwitch';
  action: 'switchNetwork';
  network: string;
  chainId?: number;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface VariableOperation {
  action: 'set' | 'update' | 'delete' | 'increment' | 'decrement' | 'concat' | 'clear';
  key: string;
  value?: string | number | boolean | null;
  expression?: string;  // For complex updates using JavaScript expressions
  type?: 'string' | 'number' | 'boolean' | 'json' | 'array';  // Type casting
  source?: string;  // Reference another variable as source
}

export interface VariableManagerNodeProperties extends BaseNodeProperties {
  nodeType: 'variableManager';
  operations: VariableOperation[];
  scope?: 'local' | 'global' | 'flow';  // Variable scope
  persist?: boolean;  // Whether to persist variables across automation runs
  initializeWith?: Record<string, any>;  // Initial values for variables
}

export interface SubtitleToVoiceNodeProperties extends BaseNodeProperties {
  nodeType: 'subtitleToVoice';
  subtitleFile: string;
  outputFile: string;
  language: string;
  voice: string;
  subtitleFormat?: 'srt' | 'vtt' | 'ass';
  outputPath?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  splitByLine?: boolean;
  preserveTimings?: boolean;
  variableOperations?: VariableOperation[];
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface EditVideoNodeProperties extends BaseNodeProperties {
  nodeType: 'editVideo';
  inputPath: string;
  outputPath: string;
  format?: 'mp4' | 'mov' | 'avi' | 'webm';
  quality?: number;
  preserveAudio?: boolean;
  audioTrack?: string;
  operations: Array<{
    type: 'trim' | 'crop' | 'resize' | 'overlay' | 'merge' | 'addAudio' | 'speed' | 'filter';
    params: {
      start?: number;
      end?: number;
      width?: number;
      height?: number;
      path?: string;
      x?: number;
      y?: number;
      speed?: number;
      filter?: string;
    };
  }>;
  variableOperations?: VariableOperation[];
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export interface FilePickerNodeProperties extends BaseNodeProperties {
  nodeType: 'filePicker';
  filePath: string;
  fileName?: string;
  multiple?: boolean;
  directory?: boolean;
  accept?: string;
  variableKey?: string;
  variableOperations?: VariableOperation[];
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
}

export type NodeProperties = 
  | OpenUrlNodeProperties 
  | ClickNodeProperties 
  | TypeNodeProperties 
  | SelectNodeProperties 
  | WaitNodeProperties 
  | ConditionNodeProperties 
  | LoopNodeProperties 
  | ExtractNodeProperties 
  | EvaluateNodeProperties 
  | KeyboardNodeProperties 
  | FocusNodeProperties 
  | HoverNodeProperties 
  | ScreenshotNodeProperties
  | ScrollNodeProperties
  | IframeNodeProperties
  | AlertNodeProperties
  | CookieNodeProperties
  | StorageNodeProperties
  | FileUploadNodeProperties
  | DragDropNodeProperties
  | NetworkNodeProperties
  | WalletConnectNodeProperties
  | WalletSignNodeProperties
  | WalletSendNodeProperties
  | WalletBalanceNodeProperties
  | WalletApproveNodeProperties
  | WalletSwitchNodeProperties
  | VariableManagerNodeProperties
  | SubtitleToVoiceNodeProperties
  | EditVideoNodeProperties
  | FilePickerNodeProperties; 