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
    console.log('Creating new ExecutionService instance');
    this.eventEmitter = new EventEmitter();
    this.automationService = AutomationService.getInstance();
    this.initializeQueueProcessor();
  }

  public static getInstance(): ExecutionService {
    if (!ExecutionService.instance) {
      console.log('Initializing ExecutionService singleton');
      ExecutionService.instance = new ExecutionService();
    }
    return ExecutionService.instance;
  }

  private initializeQueueProcessor(): void {
    console.log('Initializing queue processor');
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

    // Handle URL navigation first if specified
    if (props.url && (node.type === 'openUrl' || props.navigate)) {
      actions.push({
        type: 'wait',
        condition: 'networkIdle'
      });
    }

    switch (node.type) {
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
              timeout: props.timeout
            });
          }

          actions.push(clickAction);

          if (props.waitForNavigation) {
            actions.push({
              type: 'wait',
              condition: 'networkIdle'
            });
          }
        }
        break;

      case 'input':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout
            });
          }

          if (props.focus) {
            actions.push({
              type: 'focus',
              selector: props.selector
            });
          }

          if (props.clearFirst) {
            actions.push({
              type: 'click',
              selector: props.selector,
              clickCount: 3
            });
            actions.push({
              type: 'keyboard',
              key: 'Backspace'
            });
          }

          actions.push({
            type: 'type',
            selector: props.selector,
            value: props.value || '',
            delay: props.delay,
            stopOnError: props.stopOnError
          });

          if (props.pressEnter) {
            actions.push({
              type: 'keyboard',
              key: 'Enter'
            });
          }
        }
        break;

      case 'select':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout
            });
          }

          actions.push({
            type: 'select',
            selector: props.selector,
            value: props.value,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'wait':
        if (props.condition === 'delay' && props.delay) {
          actions.push({
            type: 'wait',
            delay: props.delay,
            stopOnError: props.stopOnError
          });
        } else if (props.condition === 'networkIdle') {
          actions.push({
            type: 'wait',
            condition: 'networkIdle',
            timeout: props.timeout,
            stopOnError: props.stopOnError
          });
        } else if (props.selector) {
          actions.push({
            type: 'wait',
            selector: props.selector,
            timeout: props.timeout,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'extract':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout
            });
          }

          actions.push({
            type: 'extract',
            selector: props.selector,
            attribute: props.attribute || 'text',
            key: props.key || props.name || props.selector,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'keyboard':
        if (props.key) {
          actions.push({
            type: 'keyboard',
            key: props.key,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'hover':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout
            });
          }

          actions.push({
            type: 'hover',
            selector: props.selector,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'screenshot':
        const screenshotAction: AutomationAction = {
          type: 'screenshot',
          value: props.path || `screenshot-${Date.now()}.png`,
          stopOnError: props.stopOnError
        };

        if (props.selector) {
          screenshotAction.selector = props.selector;
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout
            });
          }
        }

        actions.push(screenshotAction);
        break;

      case 'evaluate':
        if (props.script) {
          actions.push({
            type: 'evaluate',
            script: props.script,
            key: props.key || props.name,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'focus':
        if (props.selector) {
          if (props.waitForSelector) {
            actions.push({
              type: 'wait',
              selector: props.selector,
              timeout: props.timeout
            });
          }

          actions.push({
            type: 'focus',
            selector: props.selector,
            stopOnError: props.stopOnError
          });
        }
        break;

      case 'condition':
      case 'loop':
        // These are handled by executeStep method
        break;

      default:
        // For custom node types, try to extract actions from properties
        if (props.actions && Array.isArray(props.actions)) {
          actions.push(...props.actions);
        }
        break;
    }

    // Add any post-action waits
    if (props.waitAfter) {
      if (typeof props.waitAfter === 'number') {
        actions.push({
          type: 'wait',
          delay: props.waitAfter
        });
      } else if (props.waitAfter === 'networkIdle') {
        actions.push({
          type: 'wait',
          condition: 'networkIdle'
        });
      }
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
    // Get workflow and profile data
    const [workflow, profile] = await Promise.all([
      WorkflowModel.findById(execution.workflowId),
      BrowserProfileModel.findById(execution.profileId)
    ]);

    if (!workflow || !profile) {
      throw new Error('Workflow or profile not found');
    }

    // Find the node configuration from workflow
    const node = workflow.nodes.find(n => n.id === step.nodeId);
    if (!node) {
      throw new Error(`Node ${step.nodeId} not found in workflow`);
    }

    // Create execution context with all available data
    const profileObj = profile.toObject();
    const context = this.createExecutionContext(step, execution, workflow, {
      ...profileObj,
      _id: profile._id instanceof Types.ObjectId ? profile._id : new Types.ObjectId(profile._id as string)
    });

    // Convert workflow node to automation actions with context
    const actions = this.convertNodeToActions(node, context);

    try {
      // Apply browser profile settings - convert Mongoose document to plain object
      const plainProfile = profile.toObject() as any;
      console.log('Applying browser profile:', {
        name: plainProfile.name,
        id: plainProfile._id.toString(),
        executionId: (execution._id as Types.ObjectId).toString(),
        nodeId: step.nodeId,
        nodeType: step.nodeType
      });

      // Only apply profile settings without opening for manual setup
      await this.automationService.applyProfile({
        ...plainProfile,
        _id: plainProfile._id.toString(),
        name: plainProfile.name
      });

      // Execute the automation using the target URL from node properties or a default URL
      const resolvedProps = this.resolveNodeProperties(node.properties || {}, context);
      const targetUrl = node.type === 'openUrl' && resolvedProps.url 
        ? resolvedProps.url 
        : 'about:blank';
        
      const result = await this.automationService.performWebAutomation(
        targetUrl,
        actions
      );

      // Store extracted data in execution context if any
      if (result.extractedData && Object.keys(result.extractedData).length > 0) {
        execution.data = execution.data || {};
        
        // Handle data storage path if specified
        if (node.properties?.dataPath) {
          const path = this.resolveValue(node.properties.dataPath, context);
          const parts = path.split('.');
          let current = execution.data;
          
          for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = current[parts[i]] || {};
            current = current[parts[i]];
          }
          
          const lastPart = parts[parts.length - 1];
          if (node.properties?.dataMode === 'append' && Array.isArray(current[lastPart])) {
            current[lastPart].push(...Object.values(result.extractedData));
          } else {
            current[lastPart] = result.extractedData;
          }
        } else {
          Object.assign(execution.data, result.extractedData);
        }
        
        await execution.save();
      }

      if (!result.success) {
        throw new Error(result.results.find(r => !r.success)?.error || 'Automation failed');
      }

      // Handle conditional execution
      if (node.type === 'condition' && node.properties?.condition) {
        const condition = node.properties.condition;
        const value = this.evaluateCondition(condition, execution.data || {});
        
        // Find the next node based on condition result
        const nextNodeId = value ? 
          node.connections.find(id => workflow.nodes.find(n => n.id === id)?.type === 'true') :
          node.connections.find(id => workflow.nodes.find(n => n.id === id)?.type === 'false');

        if (nextNodeId) {
          const nextNode = workflow.nodes.find(n => n.id === nextNodeId);
          if (nextNode) {
            // Add next node as the next step
            execution.steps.splice(
              execution.steps.findIndex(s => s.nodeId === step.nodeId) + 1,
              0,
              {
                nodeId: nextNode.id,
                nodeType: nextNode.type,
                status: 'paused' as ExecutionStatus
              }
            );
            await execution.save();
          }
        }
      }

      // Handle loops
      if (node.type === 'loop' && node.properties?.type === 'forEach') {
        const items = this.getLoopItems(node.properties, execution.data || {});
        const loopBody = workflow.nodes.filter(n => 
          node.connections.includes(n.id) && n.type !== 'endLoop'
        );

        if (items && items.length > 0 && loopBody.length > 0) {
          // Add loop body steps for each item
          const currentIndex = execution.steps.findIndex(s => s.nodeId === step.nodeId);
          const newSteps: IExecutionStep[] = [];

          for (const item of items) {
            for (const bodyNode of loopBody) {
              newSteps.push({
                nodeId: bodyNode.id,
                nodeType: bodyNode.type,
                status: 'paused' as ExecutionStatus,
                context: { loopItem: item }
              });
            }
          }

          execution.steps.splice(currentIndex + 1, 0, ...newSteps);
          await execution.save();
        }
      }

    } catch (error) {
      // If browser crashes or other fatal error, cleanup the instance
      const executionId = (execution._id as Types.ObjectId).toString();
      await this.cleanupExecution(executionId);
      throw error;
    }
  }

  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    try {
      // Create a safe evaluation context with data
      const context = { data };
      const result = new Function('data', `return ${condition}`).call(context, data);
      return Boolean(result);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private getLoopItems(properties: any, data: Record<string, any>): any[] {
    try {
      if (properties.source === 'data' && properties.path) {
        // Get items from execution data
        return this.getValueByPath(data, properties.path) || [];
      } else if (properties.source === 'range') {
        // Generate range of numbers
        const start = Number(properties.start) || 0;
        const end = Number(properties.end) || 0;
        const step = Number(properties.step) || 1;
        return Array.from(
          { length: Math.floor((end - start) / step) + 1 },
          (_, i) => start + (i * step)
        );
      } else if (properties.source === 'static' && Array.isArray(properties.items)) {
        // Use static items array
        return properties.items;
      }
      return [];
    } catch (error) {
      console.error('Error getting loop items:', error);
      return [];
    }
  }

  private getValueByPath(obj: any, path: string): any {
    try {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    } catch {
      return undefined;
    }
  }

  public async queueExecution(workflowId: string, profileId: string, parallel: boolean = false): Promise<IExecution> {
    console.log('Queue execution called with:', { workflowId, profileId, parallel });
    
    // Validate workflow and profile
    const [workflow, profile] = await Promise.all([
      WorkflowModel.findById(workflowId),
      BrowserProfileModel.findById(profileId)
    ]);

    console.log('Found workflow and profile:', { 
      workflowExists: !!workflow, 
      profileExists: !!profile 
    });

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
    console.log('Created new execution:', (execution._id as Types.ObjectId).toString());

    if (parallel || this.runningExecutions.size < this.maxConcurrentExecutions) {
      console.log('Starting execution immediately');
      const executionId = (execution._id as Types.ObjectId).toString();
      await this.startExecution(executionId);
    } else {
      console.log('Adding execution to queue. Current queue size:', this.executionQueue.length);
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
    console.log('Starting execution:', executionId);
    const execution = await Execution.findById(executionId);
    if (!execution) throw new Error('Execution not found');

    this.runningExecutions.add(executionId);
    execution.status = 'running';
    execution.queuePosition = undefined;
    await execution.save();

    try {
      console.log('Processing steps for execution:', executionId);
      // Process each step
      for (const step of execution.steps) {
        if (execution.status !== 'running') {
          console.log('Execution no longer running, breaking step processing');
          break;
        }

        console.log('Processing step:', { nodeId: step.nodeId, type: step.nodeType });
        execution.currentStep = step;
        step.status = 'running';
        step.startTime = new Date();
        await execution.save();

        try {
          await this.executeStep(step, execution);
          step.status = 'completed';
          step.endTime = new Date();
          console.log('Step completed successfully:', step.nodeId);
        } catch (err) {
          const error = err as Error;
          console.error('Step failed:', step.nodeId, error);
          step.status = 'failed';
          step.endTime = new Date();
          step.error = error.message;
          execution.errorLogs.push(`Step ${step.nodeId} failed: ${error.message}`);
          execution.status = 'failed';
          break;
        }

        await execution.save();
      }

      if (execution.status === 'running') {
        console.log('All steps completed, marking execution as completed');
        execution.status = 'completed';
      }
    } catch (err) {
      const error = err as Error;
      console.error('Execution failed:', error);
      execution.status = 'failed';
      execution.errorLogs.push(`Execution failed: ${error.message}`);
    } finally {
      // Always cleanup browser instance when execution ends
      console.log('Cleaning up browser instance for execution:', executionId);
      await this.cleanupExecution(executionId);
    }

    execution.endTime = new Date();
    await execution.save();
    this.runningExecutions.delete(executionId);
    this.eventEmitter.emit('executionComplete', execution);
    console.log('Execution completed:', executionId);
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