import { useState, useEffect, useCallback } from 'react'
import { mockDb } from '@/lib/mockDb'

export type EmailProvider = 'gmail' | 'outlook' | 'smtp'

interface EmailSettings {
  provider: EmailProvider | null
  email: string
  connected: boolean
  from_name: string | null
  from_email: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
}

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const raw = mockDb.getEmailSettings()
    setSettings({
      provider:   raw.provider,
      email:      raw.email,
      connected:  raw.connected,
      from_name:  raw.from_name,
      from_email: raw.from_email,
      smtp_host:  raw.smtp_host,
      smtp_port:  raw.smtp_port,
      smtp_user:  raw.smtp_user,
      smtp_pass:  raw.smtp_pass,
    })
    setLoading(false)
  }, [])

  const connect = useCallback(async (provider: EmailProvider, email: string, _password: string): Promise<boolean> => {
    setSaving(true)
    mockDb.saveEmailSettings({ provider, email, connected: true })
    setSettings(prev => ({ from_name: null, from_email: null, smtp_host: null, smtp_port: null, smtp_user: null, smtp_pass: null, ...prev, provider, email, connected: true }))
    setSaving(false)
    return true
  }, [])

  const disconnect = useCallback(async (): Promise<void> => {
    setSaving(true)
    mockDb.saveEmailSettings({ connected: false })
    setSettings(prev => prev ? { ...prev, connected: false } : { provider: null, email: '', connected: false, from_name: null, from_email: null, smtp_host: null, smtp_port: null, smtp_user: null, smtp_pass: null })
    setSaving(false)
  }, [])

  const testAndConnect = useCallback(async (data: {
    provider: EmailProvider
    from_name: string
    from_email: string
    smtp_host: string | null
    smtp_port: number
    smtp_user: string | null
    smtp_pass: string | null
  }): Promise<{ ok: boolean; message: string }> => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    mockDb.saveEmailSettings({ ...data, email: data.from_email, connected: true })
    setSettings({ provider: data.provider, email: data.from_email, connected: true, from_name: data.from_name, from_email: data.from_email, smtp_host: data.smtp_host, smtp_port: data.smtp_port, smtp_user: data.smtp_user, smtp_pass: data.smtp_pass })
    setSaving(false)
    return { ok: true, message: 'Connected successfully' }
  }, [])

  return { settings, loading, saving, connect, testAndConnect, disconnect }
}
