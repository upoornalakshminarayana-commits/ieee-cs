import { useState, useEffect } from 'react'

/**
 * Responsive breakpoint hook for KHEPRIX 2K26.
 * Default breakpoint: 768px.
 *
 * Uses window.matchMedia to ONLY trigger re-renders when crossing the breakpoint boundary,
 * preventing unnecessary reloads when resizing within desktop or mobile ranges.
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    
    // Set initial match accurately
    setIsMobile(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Modern API with legacy fallback support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // @ts-expect-error legacy browser fallback
      mediaQuery.addListener(handleChange)
      // @ts-expect-error legacy browser fallback
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [breakpoint])

  return isMobile
}
