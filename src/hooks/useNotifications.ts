import { useState } from 'react'

export interface Notification {
  id: string
  workspace_id: string
  org_id: string | null
  type: string
  title: string
  body: string
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

export function useNotifications() {
  const [notifications] = useState<Notification[]>([])
  const loading = false

  function markAsRead(_id: string) { /* no-op in demo */ }
  function markAllAsRead() { /* no-op in demo */ }

  return { notifications, loading, unreadCount: 0, markAsRead, markAllAsRead }
}
