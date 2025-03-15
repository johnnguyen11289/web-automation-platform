import { Execution, IExecution, ExecutionStatus, IExecutionStep } from '../models/Execution';
import { WorkflowModel, Workflow, WorkflowNode as DbWorkflowNode } from '../models/Workflow';
import { BrowserProfileModel } from '../models/BrowserProfile';
import { EventEmitter } from 'events';
import { Types } from 'mongoose';
import { AutomationService, AutomationAction } from './automation.service';
import { BrowserProfile } from '../types/browser.types';
import crypto from 'crypto';

class ExecutionService {
  private static instance: ExecutionService;
  private executionQueue: IExecution[] = [];
  private runningExecutions: Set<string> = new Set();
  private maxConcurrentExecutions: number = 5;
  private eventEmitter: EventEmitter;
  private automationService: AutomationService;
  private activeExecutions: Set<string> = new Set();
  private isProcessing: boolean = false;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.automationService = AutomationService.getInstance();
    this.initializeQueueProcessor();
  }

  public static getInstance(): ExecutionService {
    if (!ExecutionService.instance) {
      ExecutionService.instance = new ExecutionService();
    }
    return ExecutionService.instance;
  }

  private initializeQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 1000); // Check queue every second
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.executionQueue.length > 0 && this.runningExecutions.size < this.maxConcurrentExecutions) {
        const execution = this.executionQueue.shift();
        if (execution?._id) {
          const executionId = execution._id.toString();
          await this.startExecution(executionId);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private resolveValue(value: any, context: Record<string, any>): any {
    if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
      // Support array indexing and nested properties
      return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        try {
          const trimmedPath = path.trim();
          // Handle array indexing and nested properties
          const resolvedValue = trimmedPath.split('.').reduce((obj: any, key: string) => {
            if (obj === undefined) return undefined;
            // Handle array indexing
            const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
            if (arrayMatch) {
              const [, arrayKey, index] = arrayMatch;
              return obj[arrayKey]?.[parseInt(index)];
            }
            return obj[key];
          }, context);

          if (resolvedValue === undefined) return match;
          if (typeof resolvedValue === 'object') return JSON.stringify(resolvedValue);
          return String(resolvedValue);
        } catch (error) {
          console.warn(`Error resolving value for path ${path}:`, error);
          return match;
        }
      });
    }
    return value;
  }

  private resolveNodeProperties(props: any, context: Record<string, any>): any {
    if (!props || typeof props !== 'object') return props;
    
    const resolved: any = Array.isArray(props) ? [] : {};
    
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value)) {
        resolved[key] = value.map(item => this.resolveNodeProperties(item, context));
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveNodeProperties(value, context);
      } else {
        resolved[key] = this.resolveValue(value, context);
      }
    }
    
    return resolved;
  }

  private createExecutionContext(
    step: IExecutionStep, 
    execution: IExecution, 
    workflow: Workflow, 
    profile: BrowserProfile & { _id?: Types.ObjectId }
  ): Record<string, any> {
    return {
      data: execution.data || {},
      loopItem: step.context?.loopItem,
      step: {
        id: step.nodeId,
        type: step.nodeType,
        startTime: step.startTime?.toISOString(),
        status: step.status
      },
      execution: {
        _id: (execution._id as unknown as Types.ObjectId).toString(),
        startTime: execution.startTime?.toISOString(),
        status: execution.status,
        parallelExecution: execution.parallelExecution
      },
      workflow: {
        _id: (workflow._id as unknown as Types.ObjectId).toString(),
        name: workflow.name,
        status: workflow.status
      },
      profile: {
        _id: (profile._id as Types.ObjectId)?.toString() || '',
        name: profile.name,
        browserType: profile.browserType
      },
      env: process.env,
      utils: {
        timestamp: () => Date.now(),
        random: () => Math.random(),
        uuid: () => crypto.randomUUID(),
        date: (format?: string) => {
          const date = new Date();
          if (format) {
            // Basic date formatting
            return format
              .replace('YYYY', date.getFullYear().toString())
              .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
              .replace('DD', date.getDate().toString().padStart(2, '0'))
              .replace('HH', date.getHours().toString().padStart(2, '0'))
              .replace('mm', date.getMinutes().toString().padStart(2, '0'))
              .replace('ss', date.getSeconds().toString().padStart(2, '0'));
          }
          return date.toISOString();
        }
      }
    };
  }

  private convertNodeToActions(node: DbWorkflowNode, context: Record<string, any> = {}): AutomationAction[] {
    const actions: AutomationAction[] = [];
    const props = this.resolveNodeProperties(node.properties || {}, {
      ...context,
      data: context.data || {},
      loopItem: context.loopItem,
      env: process.env,
      timestamp: Date.now(),
      random: Math.random(),
      uuid: () => crypto.randomUUID()
    });

    console.log('[ExecutionService] Converting node to actions:', {
      nodeType: node.type,
      nodeId: node.id,
      properties: props
    });

    // Handle variable operations first if they exist
    if (props.variableOperations?.length > 0) {
      props.variableOperations.forEach((operation: any) => {
        actions.push({
          type: 'variableOperation',
          operationType: operation.type,
          variableKey: operation.key,
          variableValue: operation.value,
          variableType: operation.valueType,
          sourceVariableKey: operation.sourceKey,
          stopOnError: props.stopOnError
        });
      });
    }

    switch (node.type) {
      case 'openUrl':
        if (props.url) {
          actions.push({
            type: 'openUrl',
            value: props.url,
            waitUntil: props.waitUntil || 'networkidle0',
            timeout: props.timeout || 30000,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added openUrl action:', props.url);
        }
        break;

      case 'click':
        if (props.selector) {
          const clickAction: AutomationAction = {
            type: 'click',
            selector: props.selector,
            button: props.button || 'left',
            clickCount: props.clickCount || 1,
            delay: props.delay,
            stopOnError: props.stopOnError
          };

          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout || 5000
            });
          }

          actions.push(clickAction);
          console.log('[ExecutionService] Added click action:', props.selector);

          if (props.waitForNavigation) {
            actions.push({
              type: 'wait',
              condition: 'networkIdle'
            });
          }
        }
        break;

      case 'type':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'type',
            selector: props.selector,
            value: props.value || '',
            delay: props.delay,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added type action:', props.selector);
        }
        break;

      case 'select':
        if (props.selector && props.value) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'select',
            selector: props.selector,
            value: props.value,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added select action:', props.selector);
        }
        break;

      case 'fileUpload':
        if (props.selector && props.filePath) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'fileUpload',
            selector: props.selector,
            filePath: props.filePath,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added fileUpload action:', props.selector);
        }
        break;

      case 'extract':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'extract',
            selector: props.selector,
            attribute: props.attribute || 'text',
            key: props.key || props.name || props.selector,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added extract action:', props.selector);
        }
        break;

      case 'subtitleToVoice':
        if (props.text) {
          actions.push({
            type: 'subtitleToVoice',
            text: props.text,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added subtitleToVoice action:', props.text);
        }
        break;

      case 'editVideo':
        if (props.videoPath) {
          actions.push({
            type: 'editVideo',
            videoPath: props.videoPath,
            stopOnError: props.stopOnError
          });
          console.log('[ExecutionService] Added editVideo action:', props.videoPath);
        }
        break;

      default:
        console.warn(`Unknown node type: ${node.type}`);
    }

    return actions;
  }

  private async getOrCreateBrowserInstance(executionId: string): Promise<AutomationService> {
    if (!this.activeExecutions.has(executionId)) {
      // Get the execution to find its profile
      const execution = await Execution.findById(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      // Get the profile
      const profile = await BrowserProfileModel.findById(execution.profileId);
      if (!profile) {
        throw new Error('Browser profile not found');
      }

      // Initialize with profile
      await this.automationService.init(false, profile.toObject());
      this.activeExecutions.add(executionId);
    }
    return this.automationService;
  }

  private async cleanupExecution(executionId: string) {
    this.activeExecutions.delete(executionId);
    // Only cleanup browser if no active executions
    if (this.activeExecutions.size === 0) {
      await this.automationService.close();
    }
  }

  private async executeStep(step: IExecutionStep, execution: IExecution): Promise<void> {
    // This method is now deprecated as we collect all actions first
    throw new Error('executeStep is deprecated. Actions are now collected in startExecution.');
  }

  public async queueExecution(workflowId: string, profileId: string, parallel: boolean = false): Promise<IExecution> {
    // Validate workflow and profile
    const [workflow, profile] = await Promise.all([
      WorkflowModel.findById(workflowId),
      BrowserProfileModel.findById(profileId)
    ]);

    if (!workflow) throw new Error('Workflow not found');
    if (!profile) throw new Error('Browser profile not found');

    // Create new execution
    const execution = new Execution({
      workflowId,
      profileId,
      status: 'running' as ExecutionStatus,
      startTime: new Date(),
      parallelExecution: parallel,
      steps: workflow.nodes.map(node => ({
        nodeId: node.id,
        nodeType: node.type,
        status: 'paused' as ExecutionStatus
      }))
    });

    await execution.save();

    if (parallel || this.runningExecutions.size < this.maxConcurrentExecutions) {
      const executionId = (execution._id as Types.ObjectId).toString();
      await this.startExecution(executionId);
    } else {
      this.executionQueue.push(execution);
      // Update queue position
      const executionId = (execution._id as Types.ObjectId).toString();
      await Execution.findByIdAndUpdate(executionId, {
        queuePosition: this.executionQueue.length
      });
    }

    return execution;
  }

  public async startExecution(executionId: string): Promise<void> {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');

    this.runningExecutions.add(executionId);
    execution.status = 'running';
    execution.queuePosition = undefined;
    await execution.save();

    try {
      // Get the profile and apply it once at the start
      const profile = await BrowserProfileModel.findById(execution.profileId);
      if (!profile) throw new Error('Browser profile not found');

      const plainProfile = profile.toObject() as any;
      await this.automationService.applyProfile({
        ...plainProfile,
        _id: plainProfile._id.toString(),
        name: plainProfile.name
      });

      // Get workflow data
      const workflow = await WorkflowModel.findById(execution.workflowId);
      if (!workflow) throw new Error('Workflow not found');

      console.log('[ExecutionService] Loaded workflow:', {
        id: workflow._id,
        name: workflow.name,
        nodes: workflow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          properties: node.properties
        }))
      });

      // Collect all actions and contexts first
      const allActions: AutomationAction[] = [];
      const contexts: Record<string, any>[] = [];

      for (const step of execution.steps) {
        if (execution.status !== 'running') {
          break;
        }

        execution.currentStep = step;
        step.status = 'running';
        step.startTime = new Date();
        await execution.save();

        try {
          // Create execution context
          const profileObj = profile.toObject();
          const context = this.createExecutionContext(step, execution, workflow, {
            ...profileObj,
            _id: profile._id instanceof Types.ObjectId ? profile._id : new Types.ObjectId(profile._id as string)
          });

          // Find the node configuration from workflow
          const node = workflow.nodes.find(n => n.id === step.nodeId);
          if (!node) {
            throw new Error(`Node ${step.nodeId} not found in workflow`);
          }

          console.log('[ExecutionService] Processing node:', {
            nodeId: node.id,
            nodeType: node.type,
            properties: node.properties
          });

          // Convert workflow node to automation actions with context
          const actions = this.convertNodeToActions(node, context);
          
          // Store actions and context
          allActions.push(...actions);
          contexts.push(context);

          step.status = 'completed';
          step.endTime = new Date();
        } catch (err) {
          const error = err as Error;
          step.status = 'failed';
          step.endTime = new Date();
          step.error = error.message;
          execution.errorLogs.push(`Step ${step.nodeId} failed: ${error.message}`);
          execution.status = 'failed';
          break;
        }

        await execution.save();
      }

      console.log('[ExecutionService] Generated actions:', allActions);
      // Perform automation with all collected actions
      if (execution.status === 'running' && allActions.length > 0) {
        const result = await this.automationService.performWebAutomation(allActions);

        // Handle results and update execution data
        if (result.extractedData && Object.keys(result.extractedData).length > 0) {
          execution.data = execution.data || {};
          Object.assign(execution.data, result.extractedData);
          await execution.save();
        }

        if (!result.success) {
          throw new Error(result.results.find(r => !r.success)?.error || 'Automation failed');
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
      }
    } catch (err) {
      const error = err as Error;
      execution.status = 'failed';
      execution.errorLogs.push(`Execution failed: ${error.message}`);
    } finally {
      await this.cleanupExecution(executionId);
    }

    execution.endTime = new Date();
    await execution.save();
    this.runningExecutions.delete(executionId);
    this.eventEmitter.emit('executionComplete', execution);
  }

  public async pauseExecution(executionId: string): Promise<IExecution> {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');
    if (execution.status !== 'running') throw new Error('Execution is not running');

    execution.status = 'paused';
    await execution.save();
    // Cleanup browser instance when paused
    await this.cleanupExecution(executionId);
    return execution;
  }

  public async resumeExecution(executionId: string): Promise<IExecution> {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');
    if (execution.status !== 'paused') throw new Error('Execution is not paused');

    execution.status = 'running';
    await execution.save();
    await this.startExecution(executionId);
    return execution;
  }

  public async stopExecution(executionId: string): Promise<IExecution> {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');
    if (!['running', 'paused'].includes(execution.status)) {
      throw new Error('Execution cannot be stopped');
    }

    execution.status = 'stopped';
    execution.endTime = new Date();
    await execution.save();
    this.runningExecutions.delete(executionId);
    // Cleanup browser instance when stopped
    await this.cleanupExecution(executionId);
    return execution;
  }

  public onExecutionComplete(callback: (execution: IExecution) => void): void {
    this.eventEmitter.on('executionComplete', callback);
  }
}

export default ExecutionService; 