import { ReactFlowProvider } from '@xyflow/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Studio } from '@/components/studio'

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <Studio />
      </ReactFlowProvider>
    </DndProvider>
  )
}

export default App
