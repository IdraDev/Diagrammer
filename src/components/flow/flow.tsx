import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './flow.css'
import { StandardNode } from './standard-node'
import { StandardEdge } from './standard-edge'
import { FlowContext } from './flow-context'
import type {
  StandardFlowEdge,
  StandardFlowNode,
} from '@/lib/flow-adapter'

const nodeTypes = { standard: StandardNode }
const edgeTypes = { standard: StandardEdge }

export interface FlowProps {
  nodes: StandardFlowNode[]
  edges: StandardFlowEdge[]
  onNodesChange: (changes: NodeChange<StandardFlowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<StandardFlowEdge>[]) => void
  onConnect: (c: Connection) => void
  onSelectionChange?: (s: OnSelectionChangeParams) => void
  onNodeLabelChange: (id: string, label: string) => void
  onPaneClick?: () => void
  isDark: boolean
  isEditing: boolean
}

export function Flow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onNodeLabelChange,
  onPaneClick,
  isDark,
  isEditing,
}: FlowProps) {
  const ctx = useMemo(
    () => ({ isDark, isEditing, onNodeLabelChange }),
    [isDark, isEditing, onNodeLabelChange],
  )

  return (
    <FlowContext.Provider value={ctx}>
      <ReactFlow<StandardFlowNode, StandardFlowEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={isEditing}
        nodesConnectable={isEditing}
        elementsSelectable
        edgesFocusable={isEditing}
        deleteKeyCode={isEditing ? ['Backspace', 'Delete'] : null}
        panOnScroll={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        selectionOnDrag={false}
        colorMode={isDark ? 'dark' : 'light'}
        defaultEdgeOptions={{ type: 'standard' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.4}
          color={
            isDark
              ? 'color-mix(in oklab, white 14%, transparent)'
              : 'color-mix(in oklab, black 12%, transparent)'
          }
        />
      </ReactFlow>
    </FlowContext.Provider>
  )
}
