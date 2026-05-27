import { useState, useEffect, useCallback } from 'react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { loadSession } from '@/lib/auth'

export function useOffers() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOffers = useCallback(() => {
    const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
    setOffers(mockDb.getOffers(orgId))
    setLoading(false)
  }, [])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  const getOfferByToken = useCallback(async (token: string): Promise<any | null> => {
    return mockDb.getOfferByToken(token) ?? null
  }, [])

  const respondToOffer = useCallback(async (token: string, action: 'accepted' | 'declined'): Promise<boolean> => {
    return mockDb.respondToOffer(token, action)
  }, [])

  return { offers, loading, refetch: fetchOffers, getOfferByToken, respondToOffer }
}
