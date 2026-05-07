import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LaidOutMap } from '@/lib/layouts'
import { Edge } from './edge'
import { NodeView } from './node'

export interface CanvasHandle {
  resetView: () => void
  fit: () => void
  zoomBy: (factor: number) => void
}

interface CanvasProps {
  laidOut: LaidOutMap
  isDark: boolean
  onReady?: (handle: CanvasHandle) => void
}

interface Transform {
  x: number
  y: number
  scale: number
}

const MIN_SCALE = 0.1
const MAX_SCALE = 4

export function Canvas({ laidOut, isDark, onReady }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const draggingRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Resize observer for the container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size.width || !size.height) return
    const { minX, minY, maxX, maxY } = laidOut.bounds
    const w = maxX - minX
    const h = maxY - minY
    if (w <= 0 || h <= 0) return
    const scale = Math.min(size.width / w, size.height / h, 1.4)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    setTransform({
      x: size.width / 2 - cx * scale,
      y: size.height / 2 - cy * scale,
      scale,
    })
  }, [laidOut.bounds, size.height, size.width])

  // Auto-fit when the laid-out map or container size changes
  useEffect(() => {
    fit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laidOut, size.width, size.height])

  const resetView = useCallback(() => {
    fit()
  }, [fit])

  const zoomBy = useCallback(
    (factor: number) => {
      setTransform((t) => {
        const cx = size.width / 2
        const cy = size.height / 2
        const next = clampScale(t.scale * factor)
        const k = next / t.scale
        return {
          scale: next,
          x: cx - (cx - t.x) * k,
          y: cy - (cy - t.y) * k,
        }
      })
    },
    [size.height, size.width],
  )

  // Expose handle to parent
  useEffect(() => {
    onReady?.({ resetView, fit, zoomBy })
  }, [onReady, resetView, fit, zoomBy])

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = ev.clientX - rect.left
      const cy = ev.clientY - rect.top
      setTransform((t) => {
        const factor = Math.exp(-ev.deltaY * 0.0015)
        const next = clampScale(t.scale * factor)
        const k = next / t.scale
        return {
          scale: next,
          x: cx - (cx - t.x) * k,
          y: cy - (cy - t.y) * k,
        }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Drag pan
  const onPointerDown = (ev: React.PointerEvent) => {
    if (ev.button !== 0 && ev.button !== 1) return
    ;(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId)
    draggingRef.current = {
      startX: ev.clientX,
      startY: ev.clientY,
      tx: transform.x,
      ty: transform.y,
    }
    setIsDragging(true)
  }
  const onPointerMove = (ev: React.PointerEvent) => {
    const drag = draggingRef.current
    if (!drag) return
    const dx = ev.clientX - drag.startX
    const dy = ev.clientY - drag.startY
    setTransform((t) => ({ ...t, x: drag.tx + dx, y: drag.ty + dy }))
  }
  const endDrag = (ev: React.PointerEvent) => {
    if (draggingRef.current) {
      ;(ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId)
      draggingRef.current = null
      setIsDragging(false)
    }
  }

  // Keyboard shortcuts (when canvas focused)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)
      ) {
        return
      }
      if (ev.key === '0') {
        ev.preventDefault()
        fit()
      } else if (ev.key === '+' || ev.key === '=') {
        ev.preventDefault()
        zoomBy(1.2)
      } else if (ev.key === '-' || ev.key === '_') {
        ev.preventDefault()
        zoomBy(1 / 1.2)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fit, zoomBy])

  const nodesById = useMemo(() => {
    const m = new Map<string, (typeof laidOut.nodes)[number]>()
    for (const n of laidOut.nodes) m.set(n.id, n)
    return m
  }, [laidOut])

  const edgeStroke = isDark ? 'hsl(240 5% 60%)' : 'hsl(240 6% 45%)'
  const edgeText = isDark ? 'hsl(240 5% 80%)' : 'hsl(240 6% 30%)'

  return (
    <div
      ref={containerRef}
      className="canvas-grid relative h-full w-full overflow-hidden select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ display: 'block' }}
      >
        <g
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
        >
          {laidOut.edges.map((e, i) => {
            const from = nodesById.get(e.from)
            const to = nodesById.get(e.to)
            if (!from || !to) return null
            return (
              <Edge
                key={`${e.from}-${e.to}-${e.id ?? i}`}
                edge={e}
                from={from}
                to={to}
                stroke={edgeStroke}
                textColor={edgeText}
              />
            )
          })}
          {laidOut.nodes.map((n) => (
            <NodeView key={n.id} node={n} isDark={isDark} />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/85 px-2 py-1 text-[10px] font-mono text-[var(--color-muted-foreground)] shadow-sm backdrop-blur">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  )
}

function clampScale(s: number) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))
}
