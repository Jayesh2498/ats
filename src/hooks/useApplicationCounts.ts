import { useState, useEffect } from 'react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { loadSession } from '@/lib/auth'

export function useApplicationCounts() {
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [pendingOffers, setPendingOffers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
    setTotalCandidates(mockDb.getCandidateCount(orgId))
    setPendingOffers(mockDb.getPendingOfferCount(orgId))
    setLoading(false)
  }, [])

  return { totalCandidates, pendingOffers, loading }
}
