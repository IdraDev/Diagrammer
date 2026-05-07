import { useEffect, useState } from 'react'
import { getPrefs, setPrefs, type Prefs } from './storage'

type ResolvedTheme = 'light' | 'dark'

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.style.colorScheme = resolved
}

export function useTheme() {
  const [pref, setPrefState] = useState<Prefs['theme']>(() => getPrefs().theme)
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    pref === 'system' ? systemTheme() : pref,
  )

  useEffect(() => {
    if (pref === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => setResolved(mql.matches ? 'dark' : 'light')
      onChange()
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    setResolved(pref)
  }, [pref])

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setTheme = (next: Prefs['theme']) => {
    setPrefs({ theme: next })
    setPrefState(next)
  }

  return { theme: pref, resolved, setTheme, isDark: resolved === 'dark' }
}
