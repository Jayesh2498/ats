// ============================================================
// Mock AI Engine — rule-based scoring, fully deterministic
// No React dependencies — pure TypeScript
// ============================================================

import type { Candidate } from '@/types/ats'

// ── Types ────────────────────────────────────────────────────

export type Recommendation = 'strong_yes' | 'yes' | 'maybe' | 'no'

export interface AiAnalysis {
  score:          number
  grade:          'A' | 'B' | 'C' | 'D'
  summary:        string
  strengths:      string[]
  weaknesses:     string[]
  recommendation: Recommendation
  breakdown:      ScoreBreakdown[]
  generated_at:   string
}

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

// ── Job-relevant skill lists ─────────────────────────────────

const JOB_SKILL_MAP: Record<string, string[]> = {
  default: [
    'JavaScript', 'TypeScript', 'Python', 'React', 'Vue.js', 'Angular',
    'Node.js', 'GraphQL', 'CSS', 'HTML', 'SQL', 'PostgreSQL', 'Git',
  ],
  frontend: [
    'React', 'TypeScript', 'JavaScript', 'Vue.js', 'Angular', 'CSS',
    'HTML', 'Node.js', 'GraphQL', 'webpack', 'Vite', 'Tailwind',
    'Storybook', 'Accessibility', 'Figma', 'Redux', 'Next.js',
  ],
  backend: [
    'Node.js', 'Python', 'Go', 'Java', 'PostgreSQL', 'MySQL', 'Redis',
    'Docker', 'AWS', 'GraphQL', 'REST', 'TypeScript', 'SQL', 'Kafka',
  ],
  fullstack: [
    'React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Redis',
    'Docker', 'AWS', 'GraphQL', 'Vue.js', 'Angular', 'CSS', 'HTML',
  ],
}

function getRelevantSkills(jobTitle: string): string[] {
  const t = jobTitle.toLowerCase()
  if (t.includes('frontend') || t.includes('front-end') || t.includes('ui')) return JOB_SKILL_MAP.frontend
  if (t.includes('backend') || t.includes('back-end') || t.includes('server')) return JOB_SKILL_MAP.backend
  if (t.includes('fullstack') || t.includes('full-stack') || t.includes('full stack')) return JOB_SKILL_MAP.fullstack
  return JOB_SKILL_MAP.default
}

// ── Keyword sets ─────────────────────────────────────────────

const SENIORITY_KEYWORDS = [
  'senior', 'lead', 'principal', 'architect', 'staff', 'head of',
  'manager', 'director', 'expert', 'specialist',
]

const QUALITY_KEYWORDS = [
  'scalable', 'performance', 'optimiz', 'mentor', 'team', 'cross-functional',
  'deliver', 'production', 'launch', 'shipped', 'built', 'designed',
  'led', 'improve', 'best practice', 'ownership',
]

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  return keywords.filter(k => lower.includes(k.toLowerCase())).length
}

// ── Scoring rules ─────────────────────────────────────────────

function scoreSkills(candidate: Candidate, jobTitle: string): ScoreBreakdown {
  const MAX = 40
  const relevantSkills = getRelevantSkills(jobTitle)
  const candidateSkills = (candidate.parsed_data?.skills ?? []).map(s => s.toLowerCase())
  const matches = relevantSkills.filter(s => candidateSkills.includes(s.toLowerCase()))
  // Each match = 5 pts, cap at MAX
  const earned = Math.min(MAX, matches.length * 6)
  const matchList = matches.slice(0, 5).join(', ')
  return {
    category: 'Skills Match',
    earned,
    max: MAX,
    rationale: matches.length > 0
      ? `${matches.length} relevant skill${matches.length !== 1 ? 's' : ''} matched: ${matchList}${matches.length > 5 ? '…' : ''}`
      : 'No matching skills detected',
  }
}

function scoreExperience(candidate: Candidate): ScoreBreakdown {
  const MAX = 20
  const years = candidate.parsed_data?.experience_years ?? 0
  let earned = 0
  let rationale = ''

  if (years >= 7) { earned = 20; rationale = `${years} years — senior-level experience` }
  else if (years >= 5) { earned = 17; rationale = `${years} years — experienced` }
  else if (years >= 3) { earned = 13; rationale = `${years} years — mid-level experience` }
  else if (years >= 1) { earned = 8; rationale = `${years} years — junior-level` }
  else { earned = 3; rationale = 'Less than 1 year of experience' }

  return { category: 'Experience', earned, max: MAX, rationale }
}

function scoreSummary(candidate: Candidate): ScoreBreakdown {
  const MAX = 25
  const summary = candidate.parsed_data?.summary ?? ''
  if (!summary) return { category: 'Summary Quality', earned: 0, max: MAX, rationale: 'No summary provided' }

  const seniorityHits = countKeywords(summary, SENIORITY_KEYWORDS)
  const qualityHits = countKeywords(summary, QUALITY_KEYWORDS)
  // totalHits used to cap bonus (combined count)
  const _totalHits = seniorityHits + qualityHits; void _totalHits


  // Base: 5 pts just for having a summary, then keyword bonuses
  const earned = Math.min(MAX, 5 + seniorityHits * 5 + qualityHits * 2)

  const parts: string[] = []
  if (seniorityHits > 0) parts.push(`${seniorityHits} seniority signal${seniorityHits !== 1 ? 's' : ''}`)
  if (qualityHits > 0) parts.push(`${qualityHits} quality keyword${qualityHits !== 1 ? 's' : ''}`)

  return {
    category: 'Summary Quality',
    earned,
    max: MAX,
    rationale: parts.length > 0 ? parts.join(', ') + ' detected' : 'Summary present but lacks strong signals',
  }
}

function scoreContactCompleteness(candidate: Candidate): ScoreBreakdown {
  const MAX = 5
  const hasEmail = !!candidate.email?.trim()
  const hasPhone = !!candidate.phone?.trim()
  const earned = hasEmail && hasPhone ? 5 : hasEmail ? 3 : 0
  return {
    category: 'Profile Completeness',
    earned,
    max: MAX,
    rationale: hasEmail && hasPhone
      ? 'Email and phone on file'
      : hasEmail
      ? 'Email on file, phone missing'
      : 'Missing contact info',
  }
}

function scorePipelineStage(stageName?: string): ScoreBreakdown {
  const MAX = 10
  const stage = (stageName ?? '').toLowerCase()
  let earned = 0
  let rationale = ''

  if (stage.includes('hired') || stage.includes('offer')) { earned = 10; rationale = `In "${stageName}" stage — advanced` }
  else if (stage.includes('interview')) { earned = 8; rationale = `In "${stageName}" stage — progressed` }
  else if (stage.includes('screen') || stage.includes('review')) { earned = 5; rationale = `In "${stageName}" stage — early progress` }
  else { earned = 2; rationale = `In "${stageName || 'Applied'}" stage — new applicant` }

  return { category: 'Pipeline Stage', earned, max: MAX, rationale }
}

function scoreResume(candidate: Candidate): ScoreBreakdown {
  const MAX = 15
  const pd = candidate.parsed_data ?? {}
  const hasResume = !!(pd as Record<string, unknown>).has_resume
  const educationLevel = typeof (pd as Record<string, unknown>).education_level === 'number'
    ? (pd as Record<string, unknown>).education_level as number
    : 0
  const seniority = (pd as Record<string, unknown>).seniority as string | null

  if (!hasResume) {
    return { category: 'Resume & Education', earned: 0, max: MAX, rationale: 'No resume uploaded' }
  }

  let earned = 5 // base for having a resume
  const parts: string[] = ['Resume uploaded']

  // Education bonus (0–6 pts)
  const eduBonus = Math.min(6, educationLevel * 1.5)
  earned += eduBonus
  const eduLabels = ['', 'Certified/Bootcamp', 'Associate', "Bachelor's", "Master's/MBA", 'PhD/Doctorate']
  if (educationLevel > 0) parts.push(eduLabels[educationLevel] ?? '')

  // Seniority bonus (0–4 pts)
  const seniorityBonus: Record<string, number> = { junior: 0, mid: 1, senior: 3, lead: 4, executive: 4 }
  if (seniority && seniorityBonus[seniority] !== undefined) {
    earned += seniorityBonus[seniority]
    parts.push(`${seniority.charAt(0).toUpperCase() + seniority.slice(1)}-level`)
  }

  return {
    category: 'Resume & Education',
    earned: Math.min(MAX, Math.round(earned)),
    max: MAX,
    rationale: parts.join(' · '),
  }
}

// ── Grade helper ─────────────────────────────────────────────

export function scoreToGrade(total: number): 'A' | 'B' | 'C' | 'D' {
  if (total >= 80) return 'A'
  if (total >= 65) return 'B'
  if (total >= 50) return 'C'
  return 'D'
}

// ── Main entry point ─────────────────────────────────────────

export function computeAiScore(
  candidate: Candidate,
  jobTitle: string,
  currentStageName?: string,
): ScoreResult {
  const breakdown: ScoreBreakdown[] = [
    scoreSkills(candidate, jobTitle),
    scoreExperience(candidate),
    scoreSummary(candidate),
    scoreResume(candidate),
    scoreContactCompleteness(candidate),
    scorePipelineStage(currentStageName),
  ]

  const total = Math.min(100, Math.round(breakdown.reduce((sum, b) => sum + b.earned, 0)))
  const grade = scoreToGrade(total)

  return {
    total,
    grade,
    breakdown,
    isTopCandidate: total >= 80,
  }
}

// ── Resume parser ─────────────────────────────────────────────
// Parses raw resume text into structured data for AI scoring.
// Detects skills, experience years, seniority signals, and builds a rich summary.

const ALL_KNOWN_SKILLS = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'CSS', 'HTML',
  'Tailwind', 'Sass', 'webpack', 'Vite', 'Redux', 'Storybook', 'Figma', 'Accessibility',
  // Backend
  'Node.js', 'Python', 'Go', 'Java', 'Ruby', 'PHP', 'C#', 'C++', 'Rust', 'Kotlin',
  'Express', 'FastAPI', 'Django', 'Flask', 'Spring', 'Rails',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'SQLite', 'SQL',
  // Cloud & DevOps
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions',
  'Jenkins', 'Linux', 'Nginx', 'Ansible',
  // Data & AI
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'Spark', 'Kafka',
  'Machine Learning', 'Deep Learning', 'LLM', 'OpenAI', 'LangChain',
  // APIs & protocols
  'GraphQL', 'REST', 'gRPC', 'WebSocket', 'OAuth', 'JWT',
  // Tools
  'Git', 'Jira', 'Figma', 'Postman', 'Swagger',
  // Sales / non-tech
  'Salesforce', 'HubSpot', 'Outreach', 'CRM', 'B2B', 'SaaS', 'Cold Calling',
  'Negotiation', 'Account Management', 'Pipeline Management', 'Prospecting',
]

const DEGREE_MAP: Record<string, number> = {
  'phd': 5, 'doctorate': 5,
  'master': 4, 'mba': 4, 'msc': 4, 'ms ': 4, 'm.s': 4,
  'bachelor': 3, 'bsc': 3, 'b.s': 3, 'b.e': 3, 'b.tech': 3,
  'associate': 2,
  'bootcamp': 1, 'certification': 1, 'certified': 1,
}

export interface ResumeParseResult {
  skills: string[]
  summary: string
  experience_years: number | null
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
  education_level: number   // 0–5 (higher = more advanced)
  has_resume: boolean
  raw_text: string
}

export function parseResumeText(rawText?: string): ResumeParseResult {
  if (!rawText?.trim()) {
    return { skills: [], summary: '', experience_years: null, seniority: null, education_level: 0, has_resume: false, raw_text: '' }
  }

  const text = rawText.trim()
  const lower = text.toLowerCase()

  // ── Skills detection ──────────────────────────────────────
  const skills = ALL_KNOWN_SKILLS.filter(s => lower.includes(s.toLowerCase()))

  // ── Experience years ──────────────────────────────────────
  // Try multiple patterns: "5+ years", "5 years of", "5-year"
  let experience_years: number | null = null
  const yearsPatterns = [
    /(\d{1,2})\+\s*years?/gi,
    /(\d{1,2})\s*years?\s*of\s*(experience|professional|work)/gi,
    /over\s*(\d{1,2})\s*years?/gi,
    /more\s*than\s*(\d{1,2})\s*years?/gi,
  ]
  for (const pattern of yearsPatterns) {
    const m = pattern.exec(lower)
    if (m) {
      const val = parseInt(m[1])
      if (val > 0 && val < 50) { experience_years = val; break }
    }
  }
  // Fallback: count distinct work date ranges (e.g. 2019–2022)
  if (!experience_years) {
    const dateRanges = [...lower.matchAll(/20(\d{2})\s*[-–—to]+\s*(20(\d{2})|present|current)/g)]
    if (dateRanges.length > 0) {
      const totalYears = dateRanges.reduce((sum, m) => {
        const start = 2000 + parseInt(m[1])
        const end = m[3] ? 2000 + parseInt(m[3]) : new Date().getFullYear()
        return sum + Math.max(0, end - start)
      }, 0)
      if (totalYears > 0) experience_years = Math.min(totalYears, 40)
    }
  }

  // ── Seniority detection ───────────────────────────────────
  type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null
  let seniority: SeniorityLevel = null
  if (/\b(cto|ceo|vp|vice president|chief)\b/.test(lower)) seniority = 'executive'
  else if (/\b(director|head of|principal)\b/.test(lower)) seniority = 'lead'
  else if (/\b(lead|staff|senior|sr\.)\b/.test(lower)) seniority = 'senior'
  else if (/\b(mid[\s-]level|midlevel|intermediate)\b/.test(lower)) seniority = 'mid'
  else if (/\b(junior|jr\.|entry[\s-]level|graduate|intern)\b/.test(lower)) seniority = 'junior'
  else if (experience_years) {
    if (experience_years >= 8) seniority = 'senior'
    else if (experience_years >= 4) seniority = 'mid'
    else seniority = 'junior'
  }

  // ── Education level ──────────────────────────────────────
  let education_level = 0
  for (const [keyword, level] of Object.entries(DEGREE_MAP)) {
    if (lower.includes(keyword) && level > education_level) education_level = level
  }

  // ── Build summary ────────────────────────────────────────
  // Try to find a "Summary", "Profile", "About" section
  const summaryMatch = text.match(
    /(?:summary|profile|about me|objective|bio)[:\s]*\n?([^\n]{40,400})/i
  )
  let summary = summaryMatch?.[1]?.trim() ?? ''

  // Helper: check if a string looks like human-readable prose
  // (at least 40% alphabetic chars, no PDF/encoding junk tokens)
  function isReadable(s: string): boolean {
    if (s.length < 20) return false
    const alpha = (s.match(/[a-zA-Z ]/g) ?? []).length
    const ratio = alpha / s.length
    if (ratio < 0.55) return false
    // Reject if it contains PDF binary signals
    if (/\/(Font|Encoding|Subtype|BaseFont|WinAnsi|endobj|obj\s|\bobj\b)/i.test(s)) return false
    if (/\bReportLab\b|\bPDF\b document|\bHelvetica\b/i.test(s)) return false
    return true
  }

  if (!isReadable(summary)) {
    summary = ''
    // Fall back to first readable sentence (60+ chars, prose-like)
    const sentences = text.split(/[.\n]/).map(s => s.trim()).filter(s => s.length > 60 && isReadable(s))
    summary = sentences[0] ?? ''
  }
  if (summary.length > 300) summary = summary.slice(0, 297) + '...'

  return {
    skills,
    summary,
    experience_years,
    seniority,
    education_level,
    has_resume: true,
    raw_text: text.slice(0, 5000), // cap stored text
  }
}

// Keep old name for backwards compat
export function parseResumeMock(rawText?: string) {
  return parseResumeText(rawText)
}

// ── Full Resume Analysis ──────────────────────────────────────
// Generates a complete AiAnalysis object for a candidate + job.
// Called on application submit and persisted to DB.

const SALES_KEYWORDS    = ['sales', 'outbound', 'cold calling', 'lead generation', 'crm', 'salesforce', 'hubspot', 'outreach', 'prospecting', 'pipeline', 'quota', 'revenue', 'account', 'b2b', 'sdr', 'bdr', 'ae', 'closing', 'demo', 'negotiation']
const COMM_KEYWORDS     = ['communication', 'client', 'stakeholder', 'presentation', 'customer', 'relationship', 'written', 'verbal', 'interpersonal', 'collaborate', 'team']
const STRUCTURE_SIGNALS = ['experience', 'education', 'skills', 'summary', 'objective', 'achievement', 'certification', 'project', 'award', 'responsibilities']

function buildAnalysisSummary(
  parsed: ResumeParseResult,
  jobTitle: string,
  _score: number,
  recommendation: Recommendation,
): string {
  const expText = parsed.experience_years
    ? `${parsed.experience_years} year${parsed.experience_years !== 1 ? 's' : ''} of experience`
    : 'limited documented experience'

  const seniorityText = parsed.seniority
    ? `${parsed.seniority}-level professional`
    : 'candidate'

  const skillCount = parsed.skills.length
  const skillText = skillCount > 0
    ? `with skills in ${parsed.skills.slice(0, 3).join(', ')}${skillCount > 3 ? ` and ${skillCount - 3} more` : ''}`
    : 'with no detected technical skills'

  const jobLower = jobTitle.toLowerCase()
  const isSalesRole = SALES_KEYWORDS.some(k => jobLower.includes(k)) || jobLower.includes('sdr') || jobLower.includes('sales')

  let roleMatch = ''
  if (isSalesRole) {
    const salesHits = SALES_KEYWORDS.filter(k => parsed.raw_text.toLowerCase().includes(k)).length
    roleMatch = salesHits >= 3
      ? 'Strong alignment with sales role requirements.'
      : salesHits >= 1
      ? 'Some sales-relevant experience present.'
      : 'Limited evidence of sales-specific experience.'
  }

  const recText: Record<Recommendation, string> = {
    strong_yes: 'Highly recommended for the next stage.',
    yes:        'Good fit — recommend progressing.',
    maybe:      'Potential fit — further screening advised.',
    no:         'Does not meet minimum requirements at this time.',
  }

  return [
    `This ${seniorityText} brings ${expText} ${skillText}.`,
    roleMatch,
    recText[recommendation],
  ].filter(Boolean).join(' ')
}

function buildStrengths(parsed: ResumeParseResult, jobTitle: string, _score: number): string[] {
  const strengths: string[] = []
  const raw = parsed.raw_text.toLowerCase()
  const job = jobTitle.toLowerCase()

  if (parsed.experience_years && parsed.experience_years >= 3)
    strengths.push(`${parsed.experience_years}+ years of relevant experience`)

  if (parsed.skills.length >= 4)
    strengths.push(`Broad skill set: ${parsed.skills.slice(0, 3).join(', ')}`)

  if (COMM_KEYWORDS.some(k => raw.includes(k)))
    strengths.push('Strong communication and client-facing background')

  if (SALES_KEYWORDS.filter(k => raw.includes(k)).length >= 2)
    strengths.push('Demonstrated sales and outbound experience')

  if (parsed.education_level >= 3)
    strengths.push(parsed.education_level >= 4 ? "Advanced degree (Master's or above)" : "Bachelor's degree or equivalent")

  if (parsed.seniority === 'senior' || parsed.seniority === 'lead' || parsed.seniority === 'executive')
    strengths.push(`${parsed.seniority.charAt(0).toUpperCase() + parsed.seniority.slice(1)}-level seniority signals`)

  const hasResumeSections = STRUCTURE_SIGNALS.filter(s => raw.includes(s)).length
  if (hasResumeSections >= 4)
    strengths.push('Well-structured, comprehensive resume')

  if (parsed.skills.some(s => ['React', 'TypeScript', 'Python', 'Node.js', 'AWS'].includes(s)))
    strengths.push('In-demand technical skills')

  if (job.includes('sales') || job.includes('sdr')) {
    const crmMentions = ['crm', 'salesforce', 'hubspot', 'outreach'].filter(k => raw.includes(k))
    if (crmMentions.length > 0)
      strengths.push(`CRM tool familiarity: ${crmMentions.join(', ')}`)
  }

  if (strengths.length === 0) strengths.push('Completed application with contact info')
  return strengths.slice(0, 4)
}

function buildWeaknesses(parsed: ResumeParseResult, jobTitle: string, score: number): string[] {
  const weaknesses: string[] = []
  const raw = parsed.raw_text.toLowerCase()
  const job = jobTitle.toLowerCase()

  if (!parsed.experience_years || parsed.experience_years < 1)
    weaknesses.push('No documented years of experience')
  else if (parsed.experience_years < 2)
    weaknesses.push('Limited work experience (under 2 years)')

  if (parsed.skills.length < 3)
    weaknesses.push('Few detectable skills on resume')

  if (!parsed.has_resume)
    weaknesses.push('No resume uploaded — scoring based on profile only')

  if ((job.includes('sales') || job.includes('sdr')) && SALES_KEYWORDS.filter(k => raw.includes(k)).length < 2)
    weaknesses.push('Limited sales-specific keywords or experience')

  if (!COMM_KEYWORDS.some(k => raw.includes(k)))
    weaknesses.push('No clear communication or client-facing signals')

  if (parsed.education_level === 0)
    weaknesses.push('No educational background detected')

  if (STRUCTURE_SIGNALS.filter(s => raw.includes(s)).length < 2)
    weaknesses.push('Sparse resume — lacks key sections')

  const enterpriseTerms = ['enterprise', 'fortune', 'large-scale', 'global', 'corporate']
  if (!enterpriseTerms.some(t => raw.includes(t)))
    weaknesses.push('No evidence of enterprise-scale exposure')

  if (score < 50)
    weaknesses.push('Overall profile does not closely match job requirements')

  // Return 1–3 weaknesses
  if (weaknesses.length === 0) weaknesses.push('No major gaps identified')
  return weaknesses.slice(0, 3)
}

function scoreToRecommendation(score: number): Recommendation {
  if (score >= 82) return 'strong_yes'
  if (score >= 65) return 'yes'
  if (score >= 45) return 'maybe'
  return 'no'
}

/**
 * Full resume analysis — call once on application submit.
 * Returns a complete AiAnalysis object suitable for storing in DB.
 */
export function analyzeResume(
  candidate: Candidate,
  jobTitle: string,
): AiAnalysis {
  const result = computeAiScore(candidate, jobTitle, 'Applied')
  const recommendation = scoreToRecommendation(result.total)
  const parsed: ResumeParseResult = {
    skills:           candidate.parsed_data?.skills ?? [],
    summary:          candidate.parsed_data?.summary ?? '',
    experience_years: candidate.parsed_data?.experience_years ?? null,
    seniority:        null,
    education_level:  0,
    has_resume:       !!(candidate.parsed_data as Record<string, unknown>)?.has_resume,
    raw_text:         String((candidate.parsed_data as Record<string, unknown>)?.raw_text ?? ''),
  }

  const strengths  = buildStrengths(parsed, jobTitle, result.total)
  const weaknesses = buildWeaknesses(parsed, jobTitle, result.total)
  const summary    = buildAnalysisSummary(parsed, jobTitle, result.total, recommendation)

  return {
    score:          result.total,
    grade:          result.grade,
    summary,
    strengths,
    weaknesses,
    recommendation,
    breakdown:      result.breakdown,
    generated_at:   new Date().toISOString(),
  }
}
