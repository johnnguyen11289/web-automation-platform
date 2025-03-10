import { Node, Edge } from 'reactflow';
import {
  WorkflowNodeData,
  RuntimeValue,
  OpenUrlNodeData,
  ClickNodeData,
  InputNodeData,
  SubmitNodeData,
  WaitNodeData,
  ConditionNodeData,
  LoopNodeData,
  VariableNodeData,
  ExtractNodeData,
} from '../components/WorkflowEditor/nodes/types';

export interface ExecutionContext {
  variables: Record<string, RuntimeValue>;
  getVariable: (reference: string) => any;
  setVariable: (name: string, value: any) => void;
}

export interface NodeExecutionResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: string;
}

export interface WorkflowExecutionResult {
  success: boolean;
  nodeResults: Record<string, NodeExecutionResult>;
  error?: string;
}

export class WorkflowExecutor {
  private nodes: Node<WorkflowNodeData>[];
  private edges: Edge[];
  private context: ExecutionContext;
  private nodeResults: Record<string, NodeExecutionResult>;

  constructor(nodes: Node<WorkflowNodeData>[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeResults = {};
    this.context = {
      variables: {},
      getVariable: (ref: string) => {
        const varName = ref.replace(/^\${(.*)}$/, '$1');
        return this.context.variables[varName]?.value;
      },
      setVariable: (name: string, value: any) => {
        this.context.variables[name] = {
          value,
          type: typeof value as any,
          timestamp: Date.now(),
          sourceNodeId: 'workflow',
          outputKey: name,
        };
      },
    };
  }

  private async executeNode(node: Node<WorkflowNodeData>): Promise<NodeExecutionResult> {
    try {
      switch (node.type) {
        case 'openUrl':
          return await this.executeOpenUrl(node as Node<OpenUrlNodeData>);
        case 'click':
          return await this.executeClick(node as Node<ClickNodeData>);
        case 'input':
          return await this.executeInput(node as Node<InputNodeData>);
        case 'submit':
          return await this.executeSubmit(node as Node<SubmitNodeData>);
        case 'wait':
          return await this.executeWait(node as Node<WaitNodeData>);
        case 'condition':
          return await this.executeCondition(node as Node<ConditionNodeData>);
        case 'loop':
          return await this.executeLoop(node as Node<LoopNodeData>);
        case 'extract':
          return await this.executeExtract(node as Node<ExtractNodeData>);
        case 'variable':
          return await this.executeVariable(node as Node<VariableNodeData>);
        default:
          return {
            success: false,
            error: `Unknown node type: ${node.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeOpenUrl(node: Node<OpenUrlNodeData>): Promise<NodeExecutionResult> {
    const { url, waitForLoad = true, timeout = 30000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/openUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: this.resolveVariables(url),
          waitForLoad,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: {
          success: true,
          pageTitle: result.pageTitle,
          pageUrl: result.pageUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open URL',
      };
    }
  }

  private async executeClick(node: Node<ClickNodeData>): Promise<NodeExecutionResult> {
    const { selector, button = 'left', clickCount = 1, timeout = 5000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: this.resolveVariables(selector),
          button,
          clickCount,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: { success: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to click element',
      };
    }
  }

  private async executeInput(node: Node<InputNodeData>): Promise<NodeExecutionResult> {
    const { selector, value, clearFirst = true, timeout = 5000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: this.resolveVariables(selector),
          value: this.resolveVariables(value),
          clearFirst,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: { success: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to input text',
      };
    }
  }

  private async executeSubmit(node: Node<SubmitNodeData>): Promise<NodeExecutionResult> {
    const { selector, waitForNavigation = true, timeout = 5000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: this.resolveVariables(selector),
          waitForNavigation,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: { success: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit form',
      };
    }
  }

  private async executeWait(node: Node<WaitNodeData>): Promise<NodeExecutionResult> {
    const { condition, timeout = 5000, selector, delay = 1000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/wait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition,
          selector: selector ? this.resolveVariables(selector) : undefined,
          delay,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: { success: true },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wait condition failed',
      };
    }
  }

  private async executeCondition(node: Node<ConditionNodeData>): Promise<NodeExecutionResult> {
    const { selector, condition, value, attribute, timeout = 5000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/condition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: this.resolveVariables(selector),
          condition,
          value: value ? this.resolveVariables(value) : undefined,
          attribute,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: {
          success: result.conditionMet,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Condition check failed',
      };
    }
  }

  private async executeLoop(node: Node<LoopNodeData>): Promise<NodeExecutionResult> {
    const { condition, selector, maxIterations = 10, timeout = 5000, items } = node.data;
    try {
      let itemsToProcess: any[] = [];
      
      if (condition === 'forEach' && items) {
        const itemsValue = this.context.getVariable(items);
        if (Array.isArray(itemsValue)) {
          itemsToProcess = itemsValue;
        }
      }

      const response = await fetch('/api/workflow/execute/loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition,
          selector: this.resolveVariables(selector),
          maxIterations,
          timeout,
          items: itemsToProcess,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      return {
        success: true,
        outputs: {
          currentItem: result.currentItem,
          index: result.index,
          completed: result.completed,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Loop execution failed',
      };
    }
  }

  private async executeVariable(node: Node<VariableNodeData>): Promise<NodeExecutionResult> {
    const { name, value, scope } = node.data;
    try {
      const resolvedValue = typeof value === 'string' ? this.resolveVariables(value) : value;
      this.context.setVariable(name, resolvedValue);

      return {
        success: true,
        outputs: {
          value: resolvedValue,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set variable',
      };
    }
  }

  private async executeExtract(node: Node<ExtractNodeData>): Promise<NodeExecutionResult> {
    const { selector, extractType, attribute, timeout = 5000 } = node.data;
    try {
      const response = await fetch('/api/workflow/execute/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selector: this.resolveVariables(selector),
          extractType,
          attribute,
          timeout,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Store the extracted value in the context
      if (node.data.variableName) {
        this.context.setVariable(node.data.variableName, result.value);
      }

      return {
        success: true,
        outputs: {
          extractedValue: result.value,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract data',
      };
    }
  }

  private resolveVariables(value: string): string {
    if (!value) return value;
    return value.replace(/\${([^}]+)}/g, (_, name) => {
      const val = this.context.getVariable(name);
      return val !== undefined ? String(val) : '';
    });
  }

  private getNextNodes(nodeId: string, result: NodeExecutionResult): Node<WorkflowNodeData>[] {
    return this.edges
      .filter(edge => {
        if (edge.source !== nodeId) return false;
        
        // For condition nodes, check the result
        if (edge.sourceHandle === 'true') return result.outputs?.success === true;
        if (edge.sourceHandle === 'false') return result.outputs?.success === false;
        
        return true;
      })
      .map(edge => this.nodes.find(n => n.id === edge.target))
      .filter((node): node is Node<WorkflowNodeData> => node !== undefined);
  }

  public async execute(): Promise<WorkflowExecutionResult> {
    try {
      // Find start nodes (nodes with no incoming edges)
      const startNodes = this.nodes.filter(node => 
        !this.edges.some(edge => edge.target === node.id)
      );

      if (startNodes.length === 0) {
        return {
          success: false,
          nodeResults: {},
          error: 'No start nodes found in workflow',
        };
      }

      // Execute nodes in sequence, following the edges
      const executedNodes = new Set<string>();
      const nodesToExecute = [...startNodes];

      while (nodesToExecute.length > 0) {
        const node = nodesToExecute.shift()!;
        if (executedNodes.has(node.id)) continue;

        const result = await this.executeNode(node);
        this.nodeResults[node.id] = result;
        executedNodes.add(node.id);

        if (result.success) {
          // Add next nodes to the execution queue
          const nextNodes = this.getNextNodes(node.id, result);
          nodesToExecute.push(...nextNodes);
        }
      }

      return {
        success: Object.values(this.nodeResults).every(r => r.success),
        nodeResults: this.nodeResults,
      };
    } catch (error) {
      return {
        success: false,
        nodeResults: this.nodeResults,
        error: error instanceof Error ? error.message : 'Workflow execution failed',
      };
    }
  }
} 