import { useState, useEffect, useCallback } from 'react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { loadSession } from '@/lib/auth'

export interface DbJob {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  org_id: string
  public_slug: string | null
  open_positions: number | null
  experience_level: string | null
  extra_fields: Record<string, string> | null
}

export interface DbApplication {
  id: string
  candidate_id: string
  job_id: string
  current_stage_id: string | null
  status: string
  notes: string | null
  applied_at: string
  updated_at: string
  candidate: {
    id: string
    workspace_id: string
    full_name: string
    email: string
    phone: string | null
    resume_url: string | null
    created_at: string
    updated_at: string
    parsed_data: {
      skills: string[]
      summary: string
      experience_years: number | null
      raw_text: string
      [key: string]: unknown
    }
  } | null
  current_stage: {
    id: string
    name: string
    order: number | null
  } | null
}

function getOrgId(): string {
  return loadSession()?.org_id ?? DEMO_ORG_ID
}

export function useJobs() {
  const [jobs, setJobs] = useState<DbJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    const orgId = getOrgId()
    setJobs(mockDb.getJobs(orgId))
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const publishJob = useCallback(async (id: string): Promise<void> => {
    const slug = id.replace('mock-', 'job-') + '-' + Date.now()
    mockDb.updateJob(id, { status: 'published', public_slug: mockDb.getJobById(id)?.public_slug ?? slug })
    setJobs(mockDb.getJobs(getOrgId()))
  }, [])

  const closeJob = useCallback(async (id: string): Promise<void> => {
    mockDb.updateJob(id, { status: 'closed' })
    setJobs(mockDb.getJobs(getOrgId()))
  }, [])

  const createJob = useCallback(async (data: Partial<DbJob>): Promise<DbJob | null> => {
    const orgId = getOrgId()
    const job = mockDb.createJob({ ...data, org_id: orgId })
    setJobs(mockDb.getJobs(orgId))
    return job
  }, [])

  const updateJob = useCallback(async (id: string, data: Partial<DbJob>): Promise<DbJob | null> => {
    const updated = mockDb.updateJob(id, data)
    setJobs(mockDb.getJobs(getOrgId()))
    return updated
  }, [])

  return { jobs, loading, publishJob, closeJob, createJob, updateJob, refetch: fetchJobs }
}

export function useApplications(jobId: string) {
  const [applications, setApplications] = useState<DbApplication[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = useCallback(() => {
    if (!jobId) { setLoading(false); return }
    setLoading(true)
    setApplications(mockDb.getApplications(jobId) as DbApplication[])
    setLoading(false)
  }, [jobId])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  return { applications, loading, refetch: fetchApplications }
}

export function useJobBySlug(slug: string | undefined) {
  const [job, setJob] = useState<DbJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return }
    const found = mockDb.getJobBySlug(slug)
    if (!found) setNotFound(true)
    else setJob(found)
    setLoading(false)
  }, [slug])

  return { job, loading, notFound }
}

export function useApply() {
  const [submitting, setSubmitting] = useState(false)
  const [submitStage, setSubmitStage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(async (payload: {
    job_id: string
    full_name: string
    email: string
    phone?: string
    linkedin_url?: string
    resume_file?: File
  }): Promise<{ success: boolean }> => {
    setSubmitting(true)
    setError(null)
    try {
      setSubmitStage('Saving application…')
      const stages = mockDb.getStages(payload.job_id)
      const firstStage = stages[0]

      const candidate = {
        id: 'cand-new-' + Date.now(),
        workspace_id: DEMO_ORG_ID,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone ?? null,
        resume_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parsed_data: { skills: [], summary: '', experience_years: null, raw_text: '' },
      }

      mockDb.createApplication({
        candidate_id: candidate.id,
        job_id: payload.job_id,
        stage_id: firstStage?.id ?? '',
        candidate,
      })

      if (payload.resume_file) {
        setSubmitStage('Processing resume…')
        await new Promise(r => setTimeout(r, 500))
      }

      setSubmitStage('')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit application'
      setError(msg)
      return { success: false }
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { apply, submitting, submitStage, error }
}
