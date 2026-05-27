import { useState, useEffect } from 'react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { loadSession } from '@/lib/auth'

export interface UpcomingInterview {
  id: string
  applicationId: string
  candidateName: string
  jobTitle: string
  scheduledAt: Date
  format: string
  durationMins: number
}

export function useUpcomingInterviews() {
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
    const now = new Date()
    const mapped: UpcomingInterview[] = mockDb
      .getInterviews(orgId)
      .filter(iv => new Date(iv.scheduled_at) >= now)
      .map(iv => ({
        id:            iv.id,
        applicationId: iv.application_id,
        candidateName: iv.candidate_name,
        jobTitle:      iv.job_title,
        scheduledAt:   new Date(iv.scheduled_at),
        format:        iv.format,
        durationMins:  iv.duration_mins,
      }))
    setInterviews(mapped)
    setLoading(false)
  }, [])

  return { interviews, loading }
}
