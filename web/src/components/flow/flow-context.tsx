import { createContext } from 'react'

interface FlowContextValue {
  isDark: boolean
  isEditing: boolean
  onNodeLabelChange?: (id: string, label: string) => void
}

export const FlowContext = createContext<FlowContextValue>({
  isDark: false,
  isEditing: false,
})
