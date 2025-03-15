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
  openInNewTab?: boolean;  // Whether to open URL in a new tab
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

// New node types for enhanced automation
export interface ScrollNodeProperties extends BaseNodeProperties {
  nodeType: 'scroll';
  selector?: string;  // Optional element to scroll to
  direction?: 'up' | 'down' | 'intoView';
  amount?: number;    // Amount to scroll (in pixels)
  smooth?: boolean;   // Whether to use smooth scrolling
}

export interface IframeNodeProperties extends BaseNodeProperties {
  nodeType: 'iframe';
  selector: string;   // iframe selector
  action: 'switch' | 'switchBack';  // Whether to switch to iframe or back to main context
}

export interface AlertNodeProperties extends BaseNodeProperties {
  nodeType: 'alert';
  action: 'accept' | 'dismiss' | 'type';
  text?: string;      // Text to type (for prompt alerts)
}

export interface CookieNodeProperties extends BaseNodeProperties {
  nodeType: 'cookie';
  action: 'get' | 'set' | 'delete' | 'clear';
  name?: string;      // Cookie name
  value?: string;     // Cookie value
  key?: string;       // Key to store cookie value
}

export interface StorageNodeProperties extends BaseNodeProperties {
  nodeType: 'storage';
  storageType: 'local' | 'session';
  action: 'get' | 'set' | 'remove' | 'clear';
  key?: string;       // Storage key
  value?: string;     // Value to set
  resultKey?: string; // Key to store result
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

// Extension nodes for crypto wallet integration
export interface WalletConnectNodeProperties extends BaseNodeProperties {
  nodeType: 'walletConnect';
  action: 'connect' | 'disconnect';
  walletType: 'metamask' | 'phantom' | 'solflare' | 'walletconnect';
  network?: string;   // e.g., 'ethereum', 'solana', 'polygon'
}

export interface WalletSignNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSign';
  action: 'signMessage' | 'signTransaction';
  message?: string;
  transaction?: any;
  key?: string;       // Key to store signature
}

export interface WalletSendNodeProperties extends BaseNodeProperties {
  nodeType: 'walletSend';
  action: 'sendTransaction';
  to: string;
  amount: string;
  token?: string;     // For ERC20 tokens
  network?: string;
  key?: string;       // Key to store transaction hash
}

export interface WalletBalanceNodeProperties extends BaseNodeProperties {
  nodeType: 'walletBalance';
  action: 'getBalance';
  token?: string;     // For ERC20 tokens
  network?: string;
  key?: string;       // Key to store balance
}

export interface WalletApproveNodeProperties extends BaseNodeProperties {
  nodeType: 'walletApprove';
  action: 'approveToken';
  token: string;
  spender: string;
  amount: string;
  network?: string;
  key?: string;       // Key to store approval transaction hash
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
  | VariableManagerNodeProperties; 