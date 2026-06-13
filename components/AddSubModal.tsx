'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Subscription, BillingCycle, Category } from '@/lib/supabase'
import { BILLING_CYCLES, CATEGORIES } from '@/lib/billing'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Props {
  existing?: Subscription
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_REMINDER_DAYS = [7, 3, 1]

export default function AddSubModal({ existing, onClose, onSaved }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [cycle, setCycle] = useState<BillingCycle>(existing?.billing_cycle ?? 'monthly')
  const [nextDate, setNextDate] = useState(
    existing?.next_billing_date ?? format(new Date(), 'yyyy-MM-dd')
  )
  const [category, setCategory] = useState<Category>(existing?.category ?? 'other')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [reminderDays, setReminderDays] = useState<number[]>(
    existing?.reminder_days ?? DEFAULT_REMINDER_DAYS
  )
  const [loading, setLoading] = useState(false)

  function toggleReminderDay(day: number) {
    setReminderDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => b - a)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required')
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) return toast.error('Enter a valid amount')
    if (reminderDays.length === 0) return toast.error('Select at least one reminder day')

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const payload = {
        user_id: session.user.id,
        name: name.trim(),
        amount: parseFloat(amount),
        currency: 'USD',
        billing_cycle: cycle,
        next_billing_date: nextDate,
        category,
        reminder_days: reminderDays,
        notes: notes.trim() || null,
        is_active: true,
      }

      let error
      if (existing) {
        const res = await supabase
          .from('subscriptions')
          .update(payload)
          .eq('id', existing.id)
        error = res.error
      } else {
        const res = await supabase.from('subscriptions').insert(payload)
        error = res.error
      }

      if (error) throw error
      toast.success(existing ? 'Subscription updated' : 'Subscription added')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const QUICK_REMINDER_OPTIONS = [14, 7, 5, 3, 2, 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">
            {existing ? 'Edit subscription' : 'Add subscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="label">Service name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Netflix, GitHub, Spotify..."
              className="input"
              required
            />
          </div>

          {/* Amount + Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="input pl-7"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Billing cycle</label>
              <select
                value={cycle}
                onChange={e => setCycle(e.target.value as BillingCycle)}
                className="input"
              >
                {BILLING_CYCLES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next billing date */}
          <div>
            <label className="label">Next billing date</label>
            <input
              type="date"
              value={nextDate}
              onChange={e => setNextDate(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value as Category)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                    category === c.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reminder days */}
          <div>
            <label className="label">Email reminders</label>
            <p className="text-xs text-gray-500 mb-2">Send reminder this many days before billing:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REMINDER_OPTIONS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleReminderDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    reminderDays.includes(day)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {day}d
                </button>
              ))}
            </div>
            {reminderDays.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Reminders: {reminderDays.sort((a, b) => b - a).map(d => `${d} day${d !== 1 ? 's' : ''}`).join(', ')} before billing
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Account name, login email, etc."
              className="input"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                existing ? 'Save changes' : 'Add subscription'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
