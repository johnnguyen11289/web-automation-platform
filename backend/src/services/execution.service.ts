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

  private normalizePath(path: string): string {
    // Replace forward slashes with backslashes for Windows paths
    // But only if the path starts with a drive letter (e.g., D:/)
    if (/^[A-Za-z]:/i.test(path)) {
      return path.replace(/\//g, '\\');
    }
    return path;
  }

  private resolveValue(value: any, context: Record<string, any>): any {
    if (typeof value !== 'string') return value;

    let result = value;

    // Handle simple {variableName} format first
    if (result.includes('{') && result.includes('}')) {
      result = result.replace(/\{([^{}]+)\}/g, (match, variableName) => {
        try {
          const variables = context.data?._variables || {};
          const resolvedValue = variables[variableName.trim()];
          
          if (resolvedValue === undefined) return match;
          if (typeof resolvedValue === 'object') return JSON.stringify(resolvedValue);
          return String(resolvedValue);
        } catch (error) {
          return match;
        }
      });
    }

    // Handle {{variables.xxx}} format
    if (result.includes('{{') && result.includes('}}')) {
      result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        try {
          const trimmedPath = path.trim();
          // Check if this is a variable reference
          if (trimmedPath.startsWith('variables.')) {
            const variablePath = trimmedPath.substring(10); // Remove 'variables.' prefix
            const variables = context.data?._variables || {};
            const resolvedValue = variablePath.split('.').reduce((obj: any, key: string) => {
              if (obj === undefined) return undefined;
              // Handle array indexing
              const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
              if (arrayMatch) {
                const [, arrayKey, index] = arrayMatch;
                return obj[arrayKey]?.[parseInt(index)];
              }
              return obj[key];
            }, variables);

            if (resolvedValue === undefined) return match;
            if (typeof resolvedValue === 'object') return JSON.stringify(resolvedValue);
            return String(resolvedValue);
          }

          // Handle other context paths
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
          return match;
        }
      });
    }

    // Normalize Windows paths after all variables are resolved
    if (/^[A-Za-z]:/i.test(result) || result.includes('/')) {
      result = this.normalizePath(result);
    }

    return result;
  }

  private resolveNodeProperties(props: any, context: Record<string, any>): any {
    if (!props || typeof props !== 'object') return props;
    
    // Helper function to check for variable patterns
    const hasVariablePattern = (value: string | undefined) => 
      typeof value === 'string' && (value.includes('{{') || value.includes('{'));
    
    const resolved: any = Array.isArray(props) ? [] : {};
    
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value)) {
        resolved[key] = value.map(item => this.resolveNodeProperties(item, context));
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveNodeProperties(value, context);
      } else if (typeof value === 'string' && hasVariablePattern(value)) {
        // If it's a string with variable pattern, keep it as is
        resolved[key] = value;
      } else {
        // Only resolve values that don't contain variable patterns
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
    // Get variables from execution data if they exist
    const variables = execution.data?._variables || {};

    // Initialize businessType from profile if not already set
    if (profile.businessType && !variables.businessType) {
      variables.businessType = profile.businessType;
    }

    return {
      data: {
        ...execution.data || {},
        _variables: variables  // Ensure variables are available in data._variables
      },
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
    console.log('Converting node to actions:', {
      nodeType: node.type,
      properties: node.properties
    });
    
    const props = this.resolveNodeProperties(node.properties || {}, {
      ...context,
      data: context.data || {},
      loopItem: context.loopItem,
      env: process.env,
      timestamp: Date.now(),
      random: Math.random(),
      uuid: () => crypto.randomUUID()
    });
    console.log('Resolved properties:', props);

    // Helper function to check for variable patterns
    const hasVariablePattern = (value: string | undefined) => 
      typeof value === 'string' && (value.includes('{{') || value.includes('{'));

    // Helper function to check if any of the given properties have variable patterns
    const hasAnyVariablePattern = (properties: (string | undefined)[]) => 
      properties.some(prop => hasVariablePattern(prop));

    // Helper function to get value or keep pattern
    const getValueOrPattern = (value: any) => {
      if (typeof value === 'string' && hasVariablePattern(value)) {
        console.log('Keeping pattern:', value);
        return value; // Keep the pattern
      }
      const resolved = this.resolveValue(value, context);
      console.log('Resolved value:', { original: value, resolved });
      return resolved;
    };

    // Handle variable operations first if they exist
    if (props.variableOperations?.length > 0) {
      props.variableOperations.forEach((operation: any) => {
        actions.push({
          type: 'variableOperation',
          operationType: operation.type,
          variableKey: operation.key,
          variableValue: getValueOrPattern(operation.value),
          variableType: operation.valueType,
          sourceVariableKey: operation.sourceKey,
          stopOnError: props.stopOnError
        });
      });
    }

    switch (node.type) {
      case 'variableManager':
        if (props.operations?.length > 0) {
          props.operations.forEach((operation: any) => {
            if (!context.data) context.data = {};
            if (!context.data._variables) context.data._variables = {};
            context.data._variables[operation.key] = getValueOrPattern(operation.value);
          });
        }
        break;

      case 'filePicker':
        if (props.filePath) {
          actions.push({
            type: 'filePicker',
            filePath: getValueOrPattern(props.filePath),
            fileName: props.fileName ? getValueOrPattern(props.fileName) : undefined,
            multiple: props.multiple,
            directory: props.directory,
            accept: props.accept,
            variableKey: props.variableOperations?.[0]?.key,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'openUrl':
        if (props.url) {
          actions.push({
            type: 'openUrl',
            value: getValueOrPattern(props.url),
            waitUntil: props.waitUntil || 'networkidle0',
            timeout: props.timeout || 30000,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'click':
        if (props.selector || hasVariablePattern(props.selector)) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: getValueOrPattern(props.selector),
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'click',
            selector: getValueOrPattern(props.selector),
            button: props.button || 'left',
            clickCount: props.clickCount || 1,
            delay: props.delay,
            stopOnError: props.stopOnError
          });

          if (props.waitForNavigation) {
            actions.push({
              type: 'wait',
              condition: 'networkIdle'
            });
          }
        }
        break;

      case 'type':
        if (props.selector || hasAnyVariablePattern([props.selector, props.value])) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: getValueOrPattern(props.selector),
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'type',
            selector: getValueOrPattern(props.selector),
            value: getValueOrPattern(props.value),
            delay: props.delay,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'select':
        if ((props.selector && props.value) || 
            hasAnyVariablePattern([props.selector, props.value])) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: getValueOrPattern(props.selector),
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'select',
            selector: getValueOrPattern(props.selector),
            value: getValueOrPattern(props.value),
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'extract':
        if (props.selector || hasVariablePattern(props.selector)) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: getValueOrPattern(props.selector),
              timeout: props.timeout || 5000
            });
          }

          actions.push({
            type: 'extract',
            selector: getValueOrPattern(props.selector),
            attribute: props.attribute || 'text',
            key: getValueOrPattern(props.key || props.name || props.selector),
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'fileUpload':
        if (props.selector || props.filePath || 
            hasAnyVariablePattern([props.selector, props.filePath])) {
          console.log('Creating fileUpload action:', {
            selector: props.selector,
            filePath: props.filePath,
            hasPattern: {
              selector: hasVariablePattern(props.selector),
              filePath: hasVariablePattern(props.filePath)
            }
          });
          
          const action: AutomationAction = {
            type: 'fileUpload',
            selector: getValueOrPattern(props.selector),
            filePath: getValueOrPattern(props.filePath),
            stopOnError: props.stopOnError
          };
          console.log('Created fileUpload action:', action);
          actions.push(action);
        }
        break;

      case 'subtitleToVoice':
        if ((props.inputPath && props.outputPath) || 
            hasAnyVariablePattern([props.inputPath, props.outputPath])) {
          actions.push({
            type: 'subtitleToVoice',
            inputPath: getValueOrPattern(props.inputPath),
            outputPath: getValueOrPattern(props.outputPath),
            language: getValueOrPattern(props.language) || 'en',
            options: props.options || {},
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'editVideo':
        if ((props.inputPath && props.outputPath && props.operations) || 
            hasAnyVariablePattern([props.inputPath, props.outputPath])) {
          const resolvedOperations = props.operations?.map((op: any) => ({
            ...op,
            value: getValueOrPattern(op.value)
          })) || [];

          actions.push({
            type: 'editVideo',
            inputPath: getValueOrPattern(props.inputPath),
            outputPath: getValueOrPattern(props.outputPath),
            operations: resolvedOperations,
            options: props.options || {},
            stopOnError: props.stopOnError
          });
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

  private async processVariableManagerNode(
    variableManagerNode: DbWorkflowNode,
    execution: IExecution,
    workflow: Workflow,
    profile: BrowserProfile & { _id: Types.ObjectId }
  ): Promise<void> {
    const variableManagerStep = execution.steps.find(step => step.nodeId === variableManagerNode.id);
    if (!variableManagerStep) return;

    const context = this.createExecutionContext(variableManagerStep, execution, workflow, profile);
    this.convertNodeToActions(variableManagerNode, context);

    // Store variables in execution data
    execution.data = execution.data || {};
    execution.data._variables = context.data?._variables || {};
    await execution.save();
  }

  private async processWorkflowStep(
    step: IExecutionStep,
    node: DbWorkflowNode,
    execution: IExecution,
    workflow: Workflow,
    profile: BrowserProfile & { _id: Types.ObjectId },
    variableManagerContext: Record<string, any>
  ): Promise<AutomationAction[]> {
    execution.currentStep = step;
    step.status = 'running';
    step.startTime = new Date();
    await execution.save();

    try {
      const context = this.createExecutionContext(step, execution, workflow, profile);
      context.data = {
        ...context.data,
        _variables: variableManagerContext
      };

      const actions = this.convertNodeToActions(node, context);
      step.status = 'completed';
      step.endTime = new Date();
      return actions;
    } catch (err) {
      const error = err as Error;
      step.status = 'failed';
      step.endTime = new Date();
      step.error = error.message;
      execution.errorLogs.push(`Step ${step.nodeId} failed: ${error.message}`);
      execution.status = 'failed';
      throw error;
    } finally {
      await execution.save();
    }
  }

  private async executeAutomationActions(
    actions: AutomationAction[],
    execution: IExecution
  ): Promise<void> {
    if (execution.status !== 'running' || actions.length === 0) return;

    // Helper function to check for variable patterns
    const hasVariablePattern = (value: string | undefined) => 
      typeof value === 'string' && (value.includes('{{') || value.includes('{'));

    // Create context with current variables
    const context = {
      data: {
        ...execution.data || {},
        _variables: execution.data?._variables || {}
      }
    };
    console.log('Initial execution context:', context);

    // Process actions sequentially to handle dependencies
    for (const action of actions) {
      console.log('Processing action:', action);
      
      // Resolve variable patterns for the current action
      const resolvedAction = { ...action };

      if (typeof resolvedAction.selector === 'string' && hasVariablePattern(resolvedAction.selector)) {
        console.log('Resolving selector pattern:', resolvedAction.selector);
        resolvedAction.selector = this.resolveValue(resolvedAction.selector, context);
      }
      if (typeof resolvedAction.value === 'string' && hasVariablePattern(resolvedAction.value)) {
        console.log('Resolving value pattern:', resolvedAction.value);
        resolvedAction.value = this.resolveValue(resolvedAction.value, context);
      }
      if (typeof resolvedAction.filePath === 'string' && hasVariablePattern(resolvedAction.filePath)) {
        console.log('Resolving filePath pattern:', resolvedAction.filePath);
        resolvedAction.filePath = this.resolveValue(resolvedAction.filePath, context);
        console.log('Resolved filePath:', resolvedAction.filePath);
      }

      // ... other property resolutions ...

      console.log('Executing resolved action:', resolvedAction);
      const result = await this.automationService.performWebAutomation([resolvedAction]);

      if (!result.success) {
        const error = result.results[0]?.error || 'Action failed';
        console.error('[ExecutionService] Action failed:', {
          action: resolvedAction,
          error: error
        });
        throw new Error(error);
      }

      // Update context with any extracted data or file picker results
      if (result.extractedData && Object.keys(result.extractedData).length > 0) {
        context.data = {
          ...context.data,
          ...result.extractedData,
          _variables: {
            ...context.data._variables,
            ...result.extractedData._variables
          }
        };
      }

      // Special handling for filePicker results
      if (resolvedAction.type === 'filePicker' && result.results[0]?.selectedFiles) {
        const selectedFile = result.results[0].selectedFiles[0];
        if (selectedFile && resolvedAction.variableKey) {
          context.data._variables[resolvedAction.variableKey] = selectedFile;
          // Update execution data immediately
          execution.data = {
            ...execution.data || {},
            _variables: {
              ...execution.data?._variables || {},
              [resolvedAction.variableKey]: selectedFile
            }
          };
          await execution.save();
        }
        console.log('Updated context after filePicker:', context);
      }
    }

    // Save final state
    execution.data = context.data;
    await execution.save();
  }

  public async startExecution(executionId: string): Promise<void> {
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');

    this.runningExecutions.add(executionId);
    execution.status = 'running';
    execution.queuePosition = undefined;
    await execution.save();

    try {
      // Get and validate required data
      const [profile, workflow] = await Promise.all([
        BrowserProfileModel.findById(execution.profileId),
        WorkflowModel.findById(execution.workflowId)
      ]);

      if (!profile) throw new Error('Browser profile not found');
      if (!workflow) throw new Error('Workflow not found');

      const plainProfile = profile.toObject();
      const profileWithId = {
        ...plainProfile,
        _id: profile._id instanceof Types.ObjectId ? profile._id : new Types.ObjectId(profile._id as string)
      };

      // Apply profile settings
      await this.automationService.applyProfile({
        ...plainProfile,
        _id: plainProfile._id.toString(),
        name: plainProfile.name
      });

      // Process VariableManager node first
      const variableManagerNode = workflow.nodes.find(node => node.type === 'variableManager');
      if (variableManagerNode) {
        await this.processVariableManagerNode(variableManagerNode, execution, workflow, profileWithId);
      }

      // Process all other nodes
      const allActions: AutomationAction[] = [];
      for (const step of execution.steps) {
        if (step.nodeId === variableManagerNode?.id) continue;
        if (execution.status !== 'running') break;

        const node = workflow.nodes.find(n => n.id === step.nodeId);
        if (!node) {
          throw new Error(`Node ${step.nodeId} not found in workflow`);
        }

        const actions = await this.processWorkflowStep(
          step,
          node,
          execution,
          workflow,
          profileWithId,
          execution.data?._variables || {}
        );
        allActions.push(...actions);
      }
      console.log('allActions', allActions);
      // Execute all collected actions
      await this.executeAutomationActions(allActions, execution);

      if (execution.status === 'running') {
        execution.status = 'completed';
      }
    } catch (err) {
      const error = err as Error;
      execution.status = 'failed';
      execution.errorLogs.push(`Execution failed: ${error.message}`);
    } finally {
      await this.cleanupExecution(executionId);
      execution.endTime = new Date();
      await execution.save();
      this.runningExecutions.delete(executionId);
      this.eventEmitter.emit('executionComplete', execution);
    }
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