'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * A simple hook for handling Stale-While-Revalidate (SWR) fetching in an MPA.
 * It checks sessionStorage for existing data to show it immediately on navigation,
 * then fetches from the network in the background.
 */
export function useDataCache<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(() => {
    if (typeof window === 'undefined') return null
    const cached = sessionStorage.getItem(`cache_${key}`)
    return cached ? JSON.parse(cached) : null
  })
  
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState<any>(null)

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setLoading(true)
    try {
      const freshData = await fetcher()
      setData(freshData)
      sessionStorage.setItem(`cache_${key}`, JSON.stringify(freshData))
      setError(null)
    } catch (err) {
      console.error(`Fetch error [${key}]:`, err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [key, ...dependencies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: () => fetchData(true) }
}

/**
 * Clears a specific cache or all dashboard caches
 */
export function clearDataCache(key?: string) {
  if (typeof window === 'undefined') return
  if (key) {
    sessionStorage.removeItem(`cache_${key}`)
  } else {
    // Clear all dashboard caches
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith('cache_')) sessionStorage.removeItem(k)
    })
  }
}
