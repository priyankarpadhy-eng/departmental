'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // When pathname or searchParams change, navigation finished
    const bar = document.getElementById('top-progress-bar')
    if (!bar) return

    // Finish animation
    bar.classList.remove('loading')
    bar.classList.add('finished')
    
    const timeout = setTimeout(() => {
      bar.style.width = '0%'
      bar.classList.remove('finished')
    }, 400)

    return () => clearTimeout(timeout)
  }, [pathname, searchParams])

  // We can't easily hook into "Start" of navigation in App Router without custom Links
  // So we'll use a globally exported function that Link components can call, 
  // OR we can just use a mutation observer / click interceptor.
  
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (
        anchor && 
        anchor.href && 
        anchor.href.startsWith(window.location.origin) &&
        anchor.target !== '_blank' &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        // Only trigger if it's an internal link
        const bar = document.getElementById('top-progress-bar')
        if (bar) {
          bar.classList.remove('finished')
          bar.classList.add('loading')
          bar.style.width = '30%'
          
          // Simulate progress
          setTimeout(() => { if (bar.classList.contains('loading')) bar.style.width = '70%' }, 200)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [])

  return <div id="top-progress-bar" />
}
