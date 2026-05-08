import { toPng } from 'html-to-image'
import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import type { StandardFlowNode } from './flow-adapter'
import type { Prefs } from './storage'

export interface ExportPngOptions {
  filename: string
  nodes: StandardFlowNode[]
  theme: 'light' | 'dark'
  currentTheme: Prefs['theme']
  setTheme: (t: Prefs['theme']) => void
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

async function waitFrames(count: number) {
  for (let i = 0; i < count; i++) await nextFrame()
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function exportFlowPng(opts: ExportPngOptions): Promise<void> {
  const { filename, nodes, theme, currentTheme, setTheme } = opts
  if (nodes.length === 0) throw new Error('Nothing to export.')

  setTheme(theme)
  await waitFrames(3)

  try {
    const viewportEl = document.querySelector(
      '.react-flow__viewport',
    ) as HTMLElement | null
    if (!viewportEl) throw new Error('Canvas not ready.')

    const bounds = getNodesBounds(nodes)
    const padding = 48
    const width = Math.max(640, Math.ceil(bounds.width + padding * 2))
    const height = Math.max(480, Math.ceil(bounds.height + padding * 2))
    const vp = getViewportForBounds(bounds, width, height, 0.1, 2, 0.1)

    const cssBg = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-background')
      .trim()
    const backgroundColor =
      cssBg || (theme === 'dark' ? '#0a0a0a' : '#ffffff')

    const dataUrl = await toPng(viewportEl, {
      width,
      height,
      backgroundColor,
      pixelRatio: 2,
      cacheBust: true,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
      },
    })
    triggerDownload(dataUrl, filename)
  } finally {
    setTheme(currentTheme)
  }
}
