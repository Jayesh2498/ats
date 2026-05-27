// ── Email Template Types ─────────────────────────────────────

export type TemplateCategory =
  | 'outreach'
  | 'interview'
  | 'rejection'
  | 'offer'
  | 'follow_up'
  | 'custom'

export interface EmailTemplate {
  id: string
  name: string
  category: TemplateCategory
  subject: string
  body: string
  variables: string[]        // e.g. ['candidate_name', 'role']
  created_at: string
  updated_at: string
}

// Variables that can be interpolated in templates
export type TemplateVariable = {
  key: string
  label: string
  example: string
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: 'candidate_name', label: 'Candidate Name', example: 'Jane Smith' },
  { key: 'role', label: 'Job Title', example: 'Senior Engineer' },
  { key: 'company', label: 'Company Name', example: 'Acme Corp' },
  { key: 'interview_date', label: 'Interview Date', example: 'Monday, April 14th at 2pm' },
  { key: 'interviewer_name', label: 'Interviewer Name', example: 'Alex Johnson' },
  { key: 'offer_salary', label: 'Offer Salary', example: '$120,000/year' },
  { key: 'offer_deadline', label: 'Offer Deadline', example: 'Friday, April 18th' },
  { key: 'sender_name', label: 'Your Name', example: 'Taylor Recruiter' },
]

/** Interpolate `{{variable}}` tokens in a template body or subject */
export function interpolateTemplate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`)
}

/** Extract variable keys from a template string */
export function extractVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map(m => m[1]))]
}
