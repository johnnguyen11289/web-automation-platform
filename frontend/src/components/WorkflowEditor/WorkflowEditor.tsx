import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
  ConnectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeProps,
  getBezierPath,
  EdgeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography } from '@mui/material';
import BaseNode from './nodes/BaseNode';
import ToolboxPanel from './ToolboxPanel';
import { createNode, NODE_COLORS } from './nodes/nodeFactory';
import { WorkflowNodeData } from './nodes/types';
import { WorkflowProvider } from './context/WorkflowContext';

// Custom edge components
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      style={{
        ...style,
        strokeWidth: 2,
        stroke: data?.type === 'data' ? '#009688' : '#555',
      }}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
};

// Edge types with custom components
const edgeTypes = {
  default: CustomEdge,
  success: CustomEdge,
  failure: CustomEdge,
  data: CustomEdge,
};

const nodeTypes = {
  openUrl: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.openUrl} />
  ),
  click: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.click} />
  ),
  input: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.input} />
  ),
  submit: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.submit} />
  ),
  wait: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.wait} />
  ),
  condition: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.condition} />
  ),
  loop: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.loop} />
  ),
  extension: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.extension} />
  ),
  variable: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.variable} />
  ),
  extract: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.extract} />
  ),
  profile: (props: NodeProps<WorkflowNodeData>) => (
    <BaseNode {...props} color={NODE_COLORS.profile} />
  ),
};

interface WorkflowEditorProps {
  workflow: {
    id: string;
    name: string;
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
  };
  onSave: (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflow, onSave }) => {
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    // Get source and target nodes
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode || !connection.source || !connection.target) return;

    // Determine edge type based on node types and handles
    let edgeType = 'default';
    
    // For condition nodes, set edge type based on handle
    if (sourceNode.type === 'condition') {
      edgeType = connection.sourceHandle === 'true' ? 'success' : 'failure';
    }
    // For nodes that output data, set edge type to data
    else if (sourceNode.type === 'extract' || sourceNode.type === 'variable') {
      edgeType = 'data';
    }

    const edge: Edge = {
      id: `${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      type: edgeType,
      data: { type: edgeType },
      animated: edgeType === 'data',
    };

    setEdges((eds) => addEdge(edge, eds));
  }, [nodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = {
      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
      y: event.clientY - event.currentTarget.getBoundingClientRect().top,
    };

    const newNode = createNode(type, position);
    setNodes((nds) => [...nds, newNode]);
  }, []);

  return (
    <WorkflowProvider>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)' }}>
        <ToolboxPanel />
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            ml: 2,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Typography variant="h6" sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            Workflow Editor: {workflow.name}
          </Typography>
          <Box sx={{ height: 'calc(100% - 48px)' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </Box>
        </Paper>
      </Box>
    </WorkflowProvider>
  );
};

export default WorkflowEditor; 