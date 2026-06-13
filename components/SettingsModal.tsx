'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Props {
  userEmail: string
  onClose: () => void
}

export default function SettingsModal({ userEmail, onClose }: Props) {
  const [reminderEmail, setReminderEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('profiles')
        .select('reminder_email')
        .eq('id', session.user.id)
        .single()
      setReminderEmail(data?.reminder_email ?? userEmail)
      setFetching(false)
    })
  }, [userEmail])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({ reminder_email: reminderEmail })
        .eq('id', session.user.id)
      if (error) throw error
      toast.success('Settings saved')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          <div>
            <label className="label">Account email</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="input bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label">Reminder email</label>
            <p className="text-xs text-gray-500 mb-2">
              All billing reminders will be sent here. Can be different from your login email.
            </p>
            {fetching ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <input
                type="email"
                value={reminderEmail}
                onChange={e => setReminderEmail(e.target.value)}
                placeholder="reminders@example.com"
                className="input"
                required
              />
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || fetching} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
