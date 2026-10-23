import { useEffect, useState } from 'react'
import { getStaffDashboardSummary } from '../../services/staffDashboardService.js'
import { readInitialTrendFilters } from './staffDashboardFilters.js'

function useStaffDashboard() {
  const [trendFilters, setTrendFilters] = useState(readInitialTrendFilters)
  const [reloadKey, setReloadKey] = useState(0)
  const [dashboardState, setDashboardState] = useState({
    status: 'loading',
    data: null,
    appliedFilters: trendFilters,
    filterError: false,
  })

  useEffect(() => {
    let active = true
    getStaffDashboardSummary(trendFilters)
      .then((data) => {
        if (active) {
          setDashboardState({
            status: 'success',
            data,
            appliedFilters: trendFilters,
            filterError: false,
          })
        }
      })
      .catch(() => {
        if (active) {
          setDashboardState((current) => current.data
            ? { ...current, status: 'success', filterError: true }
            : { ...current, status: 'error', data: null })
        }
      })

    return () => {
      active = false
    }
  }, [reloadKey, trendFilters])

  const startRefresh = () => {
    setDashboardState((current) => ({
      ...current,
      status: current.data ? 'refreshing' : 'loading',
      filterError: false,
    }))
  }

  const retryDashboard = () => {
    startRefresh()
    setReloadKey((current) => current + 1)
  }

  const updateTrendFilters = (changes) => {
    const nextFilters = { ...trendFilters, ...changes }
    const params = new URLSearchParams(window.location.search)
    params.set('days', String(nextFilters.days))
    if (nextFilters.status) params.set('status', nextFilters.status)
    else params.delete('status')
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    startRefresh()
    setTrendFilters(nextFilters)
  }

  return {
    dashboardState,
    retryDashboard,
    trendFilters,
    updateTrendFilters,
  }
}

export default useStaffDashboard
