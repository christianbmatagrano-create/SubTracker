'use client'

import { useState } from 'react'
import type { Subscription } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { formatCurrency, daysUntil, toMonthlyAmount, CATEGORIES, BILLING_CYCLES, advanceBillingDate } from '@/lib/billing'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

interface Props {
  sub: Subscription
  dark?: boolean
  onEdit: () => void
  onDelete: () => void
  onRefresh: () => void
}

export default function SubCard({ sub, dark = true, onEdit, onDelete, onRefresh }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const days = daysUntil(sub.next_billing_date)
  const category = CATEGORIES.find(c => c.value === sub.category)
  const cycle = BILLING_CYCLES.find(c => c.value === sub.billing_cycle)
  const monthlyEquivalent = toMonthlyAmount(sub.amount, sub.billing_cycle)
  const isPaid = days > 7

  const urgencyClass =
    days < 0  ? 'text-red-400 bg-red-900/30 border-red-700/50' :
    days === 0 ? 'text-red-400 bg-red-900/30 border-red-700/50' :
    days <= 1  ? 'text-red-400 bg-red-900/30 border-red-700/50' :
    days <= 3  ? 'text-amber-400 bg-amber-900/30 border-amber-700/50' :
    days <= 7  ? 'text-blue-400 bg-blue-900/30 border-blue-700/50' :
    'text-green-400 bg-green-900/30 border-green-700/50'

  const urgencyClassLight =
    days < 0  ? 'text-red-600 bg-red-50 border-red-200' :
    days === 0 ? 'text-red-600 bg-red-50 border-red-200' :
    days <= 1  ? 'text-red-600 bg-red-50 border-red-200' :
    days <= 3  ? 'text-amber-600 bg-amber-50 border-amber-200' :
    days <= 7  ? 'text-blue-600 bg-blue-50 border-blue-200' :
    'text-green-600 bg-green-50 border-green-200'

  const dueLabelText =
    days < 0  ? 'Overdue' :
    days === 0 ? 'Today' :
    days === 1 ? 'Tomorrow' :
    days <= 7  ? `${days} days` :
    '✓ Paid'

  async function handleMarkPaid() {
    setMarkingPaid(true)
    try {
      const currentDate = parseISO(sub.next_billing_date)
      const nextDate = advanceBillingDate(currentDate, sub.billing_cycle)
      const nextDateStr = format(nextDate, 'yyyy-MM-dd')
      const { error } = await supabase
        .from('subscriptions')
        .update({ next_billing_date: nextDateStr })
        .eq('id', sub.id)
      if (error) throw error
      toast.success(`${sub.name} marked as paid — next bill ${format(nextDate, 'MMM d')}`)
      onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

  const cardClass = dark
    ? `rounded-2xl border p-4 flex items-center gap-4 transition-all bg-slate-900/60 border-slate-700/60 hover:border-slate-600/80 hover:bg-slate-800/60 ${isPaid ? 'opacity-50' : ''}`
    : `rounded-2xl border p-4 flex items-center gap-4 transition-all bg-white border-gray-200 hover:shadow-md ${isPaid ? 'opacity-50' : ''}`

  const nameClass = dark ? 'text-white' : 'text-gray-900'
  const metaClass = dark ? 'text-slate-500' : 'text-gray-500'
  const amountClass = dark ? 'text-white' : 'text-gray-900'
  const iconBg = dark ? 'bg-slate-800' : 'bg-gray-100'
  const btnClass = dark
    ? 'p-2 rounded-lg transition-colors text-slate-500 hover:text-white hover:bg-slate-700'
    : 'p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100'

  return (
    <div className={cardClass}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-xl shrink-0`}>
        {category?.emoji ?? '📦'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-semibold text-sm ${nameClass}`}>{sub.name}</span>
          {sub.notes && (
            <span className={`text-xs truncate hidden sm:block ${metaClass}`}>— {sub.notes}</span>
          )}
        </div>
        <div className={`flex items-center gap-3 text-xs ${metaClass}`}>
          <span>{cycle?.label ?? sub.billing_cycle}</span>
          <span>·</span>
          <span>{format(parseISO(sub.next_billing_date), 'MMM d, yyyy')}</span>
          {sub.billing_cycle !== 'monthly' && (
            <>
              <span>·</span>
              <span className={dark ? 'text-slate-600' : 'text-gray-400'}>{formatCurrency(monthlyEquivalent)}/mo</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`font-bold ${amountClass}`}>{formatCurrency(sub.amount, sub.currency)}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${dark ? urgencyClass : urgencyClassLight}`}>
          {dueLabelText}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isPaid && (
          <button
            onClick={handleMarkPaid}
            disabled={markingPaid}
            className={`p-2 rounded-lg transition-colors ${dark ? 'text-slate-500 hover:text-green-400 hover:bg-green-900/30' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
            title="Mark as paid"
          >
            {markingPaid ? (
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        )}

        <button onClick={onEdit} className={btnClass} title="Edit">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete()} className="p-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 transition-colors text-xs font-medium">
              Remove
            </button>
            <button onClick={() => setConfirmDelete(false)} className={`p-2 rounded-lg text-xs transition-colors ${dark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-400 hover:bg-gray-100'}`}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className={`p-2 rounded-lg transition-colors ${dark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            title="Delete"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}