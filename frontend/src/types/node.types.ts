export type ErrorHandlingStrategy = 'retry' | 'skip' | 'stop';

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
}

export interface ClickNodeProperties extends BaseNodeProperties {
  nodeType: 'click';
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  waitForSelector?: boolean;
  waitForNavigation?: boolean;
}

export interface TypeNodeProperties extends BaseNodeProperties {
  nodeType: 'type';
  selector: string;
  value: string;
  delay?: number;
  clearFirst?: boolean;
  waitForSelector?: boolean;
  pressEnter?: boolean;
}

export interface SelectNodeProperties extends BaseNodeProperties {
  nodeType: 'select';
  selector: string;
  value: string;
  waitForSelector?: boolean;
}

export interface WaitNodeProperties extends BaseNodeProperties {
  nodeType: 'wait';
  condition?: 'networkIdle' | 'delay';
  delay?: number;
  selector?: string;
  timeout?: number;
}

export interface ExtractNodeProperties extends BaseNodeProperties {
  nodeType: 'extract';
  selector: string;
  attribute?: string;
  key?: string;
  waitForSelector?: boolean;
}

export interface EvaluateNodeProperties extends BaseNodeProperties {
  nodeType: 'evaluate';
  script: string;
  key?: string;
}

export interface KeyboardNodeProperties extends BaseNodeProperties {
  nodeType: 'keyboard';
  key: string;
}

export interface FocusNodeProperties extends BaseNodeProperties {
  nodeType: 'focus';
  selector: string;
  waitForSelector?: boolean;
}

export interface HoverNodeProperties extends BaseNodeProperties {
  nodeType: 'hover';
  selector: string;
  waitForSelector?: boolean;
}

export interface ScreenshotNodeProperties extends BaseNodeProperties {
  nodeType: 'screenshot';
  path?: string;
  selector?: string;
  waitForSelector?: boolean;
}

export interface ConditionNodeProperties extends BaseNodeProperties {
  nodeType: 'condition';
  conditionType: 'equals' | 'contains' | 'exists';
  targetVariable: string;
  selector?: string;
  truePath: string;
  falsePath: string;
}

export interface LoopNodeProperties extends BaseNodeProperties {
  nodeType: 'loop';
  loopType: 'fixed' | 'list';
  maxIterations: number;
  breakCondition?: string;
}

export interface ScrollNodeProperties extends BaseNodeProperties {
  nodeType: 'scroll';
  selector?: string;
  direction?: 'up' | 'down' | 'intoView';
  amount?: number;
  smooth?: boolean;
}

export interface IframeNodeProperties extends BaseNodeProperties {
  nodeType: 'iframe';
  selector: string;
  action: 'switch' | 'switchBack';
}

export interface AlertNodeProperties extends BaseNodeProperties {
  nodeType: 'alert';
  action: 'accept' | 'dismiss' | 'type';
  text?: string;
}

export interface CookieNodeProperties extends BaseNodeProperties {
  nodeType: 'cookie';
  action: 'get' | 'set' | 'delete' | 'clear';
  name?: string;
  value?: string;
  key?: string;
}

export interface StorageNodeProperties extends BaseNodeProperties {
  nodeType: 'storage';
  storageType: 'local' | 'session';
  action: 'get' | 'set' | 'remove' | 'clear';
  key?: string;
  value?: string;
  resultKey?: string;
}

export interface FileUploadNodeProperties extends BaseNodeProperties {
  nodeType: 'fileUpload';
  selector: string;
  filePath: string;
  waitForSelector?: boolean;
}

export interface DragDropNodeProperties extends BaseNodeProperties {
  nodeType: 'dragDrop';
  sourceSelector: string;
  targetSelector: string;
  waitForSelector?: boolean;
}

export interface NetworkNodeProperties extends BaseNodeProperties {
  nodeType: 'network';
  action: 'block' | 'unblock' | 'intercept';
  urlPattern?: string;
  method?: string;
  response?: any;
}

export interface WalletConnectNodeProperties extends BaseNodeProperties {
  nodeType: 'walletConnect';
  action: 'connect' | 'disconnect';
  walletType: 'metamask' | 'phantom' | 'solflare' | 'walletconnect';
  network?: string;
}

export interface WalletSignNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSign';
  action: 'signMessage' | 'signTransaction';
  message?: string;
  transaction?: any;
  key?: string;
}

export interface WalletSendNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSend';
  action: 'sendTransaction';
  to: string;
  amount: string;
  token?: string;
  network?: string;
  key?: string;
}

export interface WalletBalanceNodeProperties extends BaseNodeProperties {
  nodeType: 'walletBalance';
  action: 'getBalance';
  token?: string;
  network?: string;
  key?: string;
}

export interface WalletApproveNodeProperties extends BaseNodeProperties {
  nodeType: 'walletApprove';
  action: 'approveToken';
  token: string;
  spender: string;
  amount: string;
  network?: string;
  key?: string;
}

export interface WalletSwitchNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSwitch';
  action: 'switchNetwork';
  network: string;
  chainId?: number;
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
  subtitleFile?: string;  // Path to subtitle file or content
  subtitleFormat?: 'srt' | 'vtt' | 'ass';  // Subtitle format
  language: string;  // Target language for voice
  voice?: string;  // Voice model/type to use
  outputPath?: string;  // Where to save the generated audio
  speed?: number;  // Speech rate (1.0 is normal)
  pitch?: number;  // Voice pitch adjustment
  volume?: number;  // Output volume level
  splitByLine?: boolean;  // Whether to generate separate audio files for each line
  preserveTimings?: boolean;  // Whether to maintain original subtitle timings
}

export interface EditVideoNodeProperties extends BaseNodeProperties {
  nodeType: 'editVideo';
  inputPath: string;  // Source video file
  outputPath?: string;  // Output video file
  operations: Array<{
    type: 'trim' | 'crop' | 'resize' | 'overlay' | 'merge' | 'addAudio' | 'speed' | 'filter';
    params: {
      start?: number;  // Start time for trim
      end?: number;    // End time for trim
      width?: number;  // Width for resize/crop
      height?: number; // Height for resize/crop
      x?: number;      // X position for crop/overlay
      y?: number;      // Y position for crop/overlay
      path?: string;   // Path for overlay/merge/audio files
      speed?: number;  // Playback speed
      filter?: string; // Video filter to apply
      [key: string]: any; // Allow additional parameters
    };
  }>;
  format?: string;  // Output format (mp4, mov, etc.)
  quality?: number; // Output quality (0-100)
  preserveAudio?: boolean;  // Whether to keep original audio
  audioTrack?: string;  // Path to custom audio track
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
  | EditVideoNodeProperties; 