'use client'

import { useState } from 'react'
import type { Subscription } from '@/lib/supabase'
import { formatCurrency, daysUntil, toMonthlyAmount, CATEGORIES, BILLING_CYCLES } from '@/lib/billing'
import { format, parseISO } from 'date-fns'

interface Props {
  sub: Subscription
  onEdit: () => void
  onDelete: () => void
}

export default function SubCard({ sub, onEdit, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const days = daysUntil(sub.next_billing_date)
  const category = CATEGORIES.find(c => c.value === sub.category)
  const cycle = BILLING_CYCLES.find(c => c.value === sub.billing_cycle)
  const monthlyEquivalent = toMonthlyAmount(sub.amount, sub.billing_cycle)

  const urgencyClass =
    days <= 1 ? 'text-red-600 bg-red-50 border-red-200' :
    days <= 3 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    days <= 7 ? 'text-blue-600 bg-blue-50 border-blue-200' :
    'text-gray-500 bg-gray-50 border-gray-200'

  const dueLabelText =
    days < 0 ? 'Overdue' :
    days === 0 ? 'Today' :
    days === 1 ? 'Tomorrow' :
    `${days} days`

  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Category emoji */}
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
        {category?.emoji ?? '📦'}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900 text-sm">{sub.name}</span>
          {sub.notes && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">— {sub.notes}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{cycle?.label ?? sub.billing_cycle}</span>
          <span>·</span>
          <span>{format(parseISO(sub.next_billing_date), 'MMM d, yyyy')}</span>
          {sub.billing_cycle !== 'monthly' && (
            <>
              <span>·</span>
              <span className="text-gray-400">{formatCurrency(monthlyEquivalent)}/mo</span>
            </>
          )}
        </div>
      </div>

      {/* Amount + due badge */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="font-bold text-gray-900">
          {formatCurrency(sub.amount, sub.currency)}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${urgencyClass}`}>
          {dueLabelText}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Edit"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDelete()}
              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors text-xs font-medium"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
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
