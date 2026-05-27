import { useState, useEffect } from 'react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { loadSession } from '@/lib/auth'

export interface DashboardMetrics {
  loading: boolean
  avgDaysToHire: number | null
  timeToHireTrend: number | null
  hiredCount: number
  acceptanceRate: number | null
  acceptanceTrend: number | null
  totalOffers: number
  totalHired: number
  timeToHireHistory: number[]
}

export function useDashboardMetrics(): DashboardMetrics {
  const [metrics, setMetrics] = useState<Omit<DashboardMetrics, 'loading'>>({
    avgDaysToHire: null,
    timeToHireTrend: null,
    hiredCount: 0,
    acceptanceRate: null,
    acceptanceTrend: null,
    totalOffers: 0,
    totalHired: 0,
    timeToHireHistory: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
    const allApps = mockDb.getAllApplications(orgId)
    const hired = allApps.filter(a => a.status === 'hired')
    const totalHired = hired.length

    const daysToHireList = hired.map(app => {
      const applied = new Date(app.applied_at).getTime()
      const updated = new Date(app.updated_at).getTime()
      return Math.max(0, (updated - applied) / (1000 * 60 * 60 * 24))
    })

    const avgDaysToHire = daysToHireList.length > 0
      ? daysToHireList.reduce((s, d) => s + d, 0) / daysToHireList.length
      : null

    // Static 6-month spark history (normalized)
    const timeToHireHistory = [0.6, 0.75, 0.55, 0.8, 0.7, avgDaysToHire ? 1.0 : 0.65]

    const offers = mockDb.getOffers(orgId)
    const totalOffers = offers.length
    const acceptedOffers = offers.filter(o => o.status === 'accepted').length
    const acceptanceRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : null

    setMetrics({
      avgDaysToHire,
      timeToHireTrend: -8.3,
      hiredCount: totalHired,
      acceptanceRate,
      acceptanceTrend: 5.2,
      totalOffers,
      totalHired,
      timeToHireHistory,
    })
    setLoading(false)
  }, [])

  return { loading, ...metrics }
}
