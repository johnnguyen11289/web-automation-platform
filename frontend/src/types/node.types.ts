export type ErrorHandlingStrategy = 'retry' | 'skip' | 'stop';

export interface BaseNodeProperties {
  nodeName: string;
  timeout: number;
  enabled: boolean;
  errorHandling: ErrorHandlingStrategy;
}

export interface OpenUrlNodeProperties extends BaseNodeProperties {
  nodeType: 'openUrl';
  url: string;
  openInNewTab: boolean;
  waitForPageLoad: boolean;
  returnPageData: boolean;
}

export interface ClickNodeProperties extends BaseNodeProperties {
  nodeType: 'click';
  selector: string;
  clickType: 'single' | 'double' | 'right';
  waitForElement: boolean;
}

export interface InputNodeProperties extends BaseNodeProperties {
  nodeType: 'input';
  selector: string;
  inputType: 'text' | 'password' | 'file';
  value: string;
  clearBeforeInput: boolean;
}

export interface SubmitNodeProperties extends BaseNodeProperties {
  nodeType: 'submit';
  selector: string;
  waitForNavigation: boolean;
}

export interface WaitNodeProperties extends BaseNodeProperties {
  nodeType: 'wait';
  waitType: 'fixed' | 'dynamic';
  timeout: number;
}

export interface ConditionNodeProperties extends BaseNodeProperties {
  nodeType: 'condition';
  conditionType: 'equals' | 'contains' | 'exists';
  target: string;
  value: string;
  truePath: string;
  falsePath: string;
}

export interface LoopNodeProperties extends BaseNodeProperties {
  nodeType: 'loop';
  loopType: 'fixed' | 'list';
  maxIterations: number;
  breakCondition?: string;
}

export interface ExtractNodeProperties extends BaseNodeProperties {
  nodeType: 'extract';
  selector: string;
  attribute: 'text' | 'html' | 'value' | 'class' | 'id' | 'href' | 'src';
  variableName: string;
}

export interface ProfileNodeProperties extends BaseNodeProperties {
  nodeType: 'profile';
  profileName: string;
  incognitoMode: boolean;
}

export type NodeProperties = 
  | OpenUrlNodeProperties 
  | ClickNodeProperties 
  | InputNodeProperties 
  | SubmitNodeProperties 
  | WaitNodeProperties 
  | ConditionNodeProperties 
  | LoopNodeProperties 
  | ExtractNodeProperties 
  | ProfileNodeProperties; 