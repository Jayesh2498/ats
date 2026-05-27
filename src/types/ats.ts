// ============================================================
// ATS Core Types
// ============================================================

export type JobStatus = 'open' | 'closed' | 'draft' | 'published'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type ApplicationStatus = 'active' | 'rejected' | 'withdrawn' | 'hired'

export type ActivityType =
  | 'created'
  | 'stage_moved'
  | 'note_added'
  | 'email_sent'
  | 'status_changed'
  | 'offer_generated'
  | 'ai_analyzed'
  | 'interview_scheduled'

// ── AI Scoring ───────────────────────────────────────────────

export interface ScoreBreakdown {
  category: string
  earned: number
  max: number
  rationale: string
}

export interface ScoreResult {
  total: number
  grade: 'A' | 'B' | 'C' | 'D'
  breakdown: ScoreBreakdown[]
  isTopCandidate: boolean
}


export interface Job {
  id: string
  workspace_id: string
  title: string
  department: string | null
  location: string | null
  employment_type: EmploymentType
  description: string | null
  status: JobStatus
  created_at: string
  updated_at: string
  // joined
  candidate_count?: number
}

export interface PipelineStage {
  id: string
  job_id: string
  name: string
  order_index: number
  created_at: string
}

export interface ParsedResumeData {
  skills: string[]
  summary: string
  experience_years: number | null
  raw_text: string
  // Extended resume fields (populated when resume uploaded)
  has_resume?: boolean
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
  education_level?: number
  [key: string]: unknown  // allow index access
}

export interface Candidate {
  id: string
  workspace_id: string
  full_name: string
  email: string
  phone: string | null
  resume_url: string | null
  parsed_data: ParsedResumeData
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  candidate_id: string
  job_id: string
  current_stage_id: string | null
  ai_score: number | null
  status: ApplicationStatus
  notes: string | null
  applied_at: string
  updated_at: string
  // joined fields
  candidate?: Candidate
  job?: Job
  current_stage?: PipelineStage
}

export interface ActivityMetadata {
  from_stage?: string
  to_stage?: string
  note_preview?: string
  email_subject?: string
  status_from?: string
  status_to?: string
  offer_amount?: string
  // Stage move HR inputs
  input_data?: Record<string, string>
  // AI analysis
  score?: number
  recommendation?: string
  // Interview scheduled
  scheduled_at?: string
  format?: string
  duration_mins?: number
}

export interface Activity {
  id: string
  application_id: string
  type: ActivityType
  metadata: ActivityMetadata
  created_at: string
}

export interface Note {
  id: string
  application_id: string
  content: string
  created_at: string
  updated_at: string
}

// ============================================================
// Input types
// ============================================================

export interface CreateJobInput {
  title: string
  department?: string
  location?: string
  employment_type?: EmploymentType
  description?: string
}

export interface CreateCandidateInput {
  full_name: string
  email: string
  phone?: string
}

export interface CreateNoteInput {
  application_id: string
  content: string
}

// ============================================================
// Constants
// ============================================================

export const DEFAULT_STAGES = [
  { name: 'Applied',   order_index: 0, color: 'gray'    },
  { name: 'Screening', order_index: 1, color: 'blue'    },
  { name: 'Interview', order_index: 2, color: 'violet'  },
  { name: 'Offer',     order_index: 3, color: 'amber'   },
  { name: 'Hired',     order_index: 4, color: 'emerald' },
]

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  internship:'Internship',
}

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  active:    'bg-viridian-50 text-viridian-700 border-viridian-200',
  rejected:  'bg-gray-100 text-gray-600 border-gray-200',
  withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
  hired:     'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  created:              'Application created',
  stage_moved:          'Stage changed',
  note_added:           'Note added',
  email_sent:           'Email sent',
  status_changed:       'Status changed',
  offer_generated:      'Offer generated',
  ai_analyzed:          'AI Analysis Complete',
  interview_scheduled:  'Interview Scheduled',
}

// Avatar color palette — deterministic from name hash
export const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
]

export function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}
