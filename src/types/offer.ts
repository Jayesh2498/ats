// ── Offer Types ────────────────────────────────────────────

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface Offer {
  id: string
  application_id: string
  candidate_name: string
  job_title: string
  salary: string
  start_date: string | null
  notes: string | null
  company_name: string | null
  role_type: string | null
  benefits: string | null
  token: string
  status: OfferStatus
  expires_at: string
  responded_at: string | null
  created_at: string
  updated_at: string
}

export interface OfferFormData {
  salary: string
  start_date: string
  notes: string
  company_name: string
  role_type: string
  benefits: string
}

export const OFFER_STATUS_META: Record<OfferStatus, { label: string; color: string }> = {
  pending:  { label: 'Pending',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-700 border-red-200' },
  expired:  { label: 'Expired',  color: 'bg-gray-100 text-gray-500 border-gray-200' },
}
