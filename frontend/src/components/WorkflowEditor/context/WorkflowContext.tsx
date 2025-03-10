import React, { createContext, useContext, useState, useCallback } from 'react';
import { RuntimeValue, VariableReference, WorkflowContext as IWorkflowContext } from '../nodes/types';

const WorkflowContext = createContext<IWorkflowContext | null>(null);

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within a WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  children: React.ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [variables, setVariables] = useState<Record<string, RuntimeValue>>({});

  const getVariable = useCallback((reference: VariableReference) => {
    // Remove ${} from the reference
    const varName = reference.replace(/^\${(.*)}$/, '$1');
    return variables[varName];
  }, [variables]);

  const setVariable = useCallback((name: string, value: RuntimeValue) => {
    setVariables((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const value: IWorkflowContext = {
    variables,
    getVariable,
    setVariable,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Helper function to resolve variable references in node data
export const resolveVariables = (
  data: Record<string, any>,
  getVariable: (ref: VariableReference) => RuntimeValue | undefined
): Record<string, any> => {
  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const varValue = getVariable(value);
      resolved[key] = varValue ? varValue.value : value;
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveVariables(value, getVariable);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}; 