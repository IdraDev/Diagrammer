import type { NodeColor } from './schema'

export interface ColorTokens {
  fill: string
  stroke: string
  text: string
  accent: string
}

/**
 * Color tokens for each named NodeColor. We keep these as raw hsl literals so
 * they read identically in light and dark mode (the canvas uses an off-white
 * surface either way for legibility, with edge strokes derived from foreground).
 */
export const NODE_COLORS: Record<NodeColor, { light: ColorTokens; dark: ColorTokens }> = {
  default: {
    light: {
      fill: 'hsl(0 0% 100%)',
      stroke: 'hsl(240 6% 75%)',
      text: 'hsl(240 10% 12%)',
      accent: 'hsl(240 6% 50%)',
    },
    dark: {
      fill: 'hsl(240 8% 12%)',
      stroke: 'hsl(240 5% 35%)',
      text: 'hsl(0 0% 96%)',
      accent: 'hsl(240 5% 70%)',
    },
  },
  slate: {
    light: {
      fill: 'hsl(220 14% 96%)',
      stroke: 'hsl(220 10% 65%)',
      text: 'hsl(220 30% 15%)',
      accent: 'hsl(220 10% 45%)',
    },
    dark: {
      fill: 'hsl(220 14% 16%)',
      stroke: 'hsl(220 10% 40%)',
      text: 'hsl(220 14% 92%)',
      accent: 'hsl(220 10% 70%)',
    },
  },
  blue: {
    light: {
      fill: 'hsl(214 100% 97%)',
      stroke: 'hsl(214 80% 65%)',
      text: 'hsl(214 80% 22%)',
      accent: 'hsl(214 80% 50%)',
    },
    dark: {
      fill: 'hsl(214 50% 16%)',
      stroke: 'hsl(214 60% 50%)',
      text: 'hsl(214 95% 92%)',
      accent: 'hsl(214 80% 70%)',
    },
  },
  green: {
    light: {
      fill: 'hsl(150 60% 95%)',
      stroke: 'hsl(150 45% 55%)',
      text: 'hsl(150 45% 18%)',
      accent: 'hsl(150 45% 38%)',
    },
    dark: {
      fill: 'hsl(150 30% 14%)',
      stroke: 'hsl(150 35% 45%)',
      text: 'hsl(150 70% 88%)',
      accent: 'hsl(150 50% 65%)',
    },
  },
  amber: {
    light: {
      fill: 'hsl(40 100% 95%)',
      stroke: 'hsl(35 85% 60%)',
      text: 'hsl(30 80% 25%)',
      accent: 'hsl(30 80% 45%)',
    },
    dark: {
      fill: 'hsl(35 40% 14%)',
      stroke: 'hsl(35 70% 50%)',
      text: 'hsl(40 95% 88%)',
      accent: 'hsl(35 80% 65%)',
    },
  },
  rose: {
    light: {
      fill: 'hsl(350 100% 96%)',
      stroke: 'hsl(350 80% 65%)',
      text: 'hsl(350 75% 28%)',
      accent: 'hsl(350 75% 50%)',
    },
    dark: {
      fill: 'hsl(350 30% 16%)',
      stroke: 'hsl(350 60% 55%)',
      text: 'hsl(350 90% 90%)',
      accent: 'hsl(350 80% 70%)',
    },
  },
  violet: {
    light: {
      fill: 'hsl(265 100% 97%)',
      stroke: 'hsl(265 75% 65%)',
      text: 'hsl(265 60% 28%)',
      accent: 'hsl(265 75% 55%)',
    },
    dark: {
      fill: 'hsl(265 35% 18%)',
      stroke: 'hsl(265 60% 60%)',
      text: 'hsl(265 90% 92%)',
      accent: 'hsl(265 80% 75%)',
    },
  },
  cyan: {
    light: {
      fill: 'hsl(190 90% 95%)',
      stroke: 'hsl(190 70% 55%)',
      text: 'hsl(190 70% 22%)',
      accent: 'hsl(190 70% 40%)',
    },
    dark: {
      fill: 'hsl(190 40% 14%)',
      stroke: 'hsl(190 60% 45%)',
      text: 'hsl(190 90% 88%)',
      accent: 'hsl(190 70% 65%)',
    },
  },
}

export function tokensFor(color: NodeColor | undefined, isDark: boolean): ColorTokens {
  const c = NODE_COLORS[color ?? 'default']
  return isDark ? c.dark : c.light
}
