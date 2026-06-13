import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns'
import type { BillingCycle } from './supabase'

export const BILLING_CYCLES: { value: BillingCycle; label: string; description: string }[] = [
  { value: 'daily',      label: 'Daily',           description: 'Every day' },
  { value: 'weekly',     label: 'Weekly',          description: 'Every 7 days' },
  { value: 'biweekly',   label: 'Bi-weekly',       description: 'Every 14 days' },
  { value: 'monthly',    label: 'Monthly',         description: 'Once a month' },
  { value: 'quarterly',  label: 'Quarterly',       description: 'Every 3 months' },
  { value: 'semiannual', label: 'Semi-annual',     description: 'Every 6 months' },
  { value: 'annual',     label: 'Annual',          description: 'Once a year' },
]

export const CATEGORIES = [
  { value: 'streaming', label: 'Streaming',  emoji: '📺' },
  { value: 'software',  label: 'Software',   emoji: '💻' },
  { value: 'utilities', label: 'Utilities',  emoji: '⚡' },
  { value: 'health',    label: 'Health',     emoji: '💊' },
  { value: 'finance',   label: 'Finance',    emoji: '💰' },
  { value: 'food',      label: 'Food',       emoji: '🍔' },
  { value: 'gaming',    label: 'Gaming',     emoji: '🎮' },
  { value: 'news',      label: 'News',       emoji: '📰' },
  { value: 'storage',   label: 'Storage',    emoji: '☁️' },
  { value: 'other',     label: 'Other',      emoji: '📦' },
] as const

/** Advance a date by one billing period */
export function advanceBillingDate(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case 'daily':      return addDays(date, 1)
    case 'weekly':     return addWeeks(date, 1)
    case 'biweekly':   return addWeeks(date, 2)
    case 'monthly':    return addMonths(date, 1)
    case 'quarterly':  return addQuarters(date, 1)
    case 'semiannual': return addMonths(date, 6)
    case 'annual':     return addYears(date, 1)
  }
}

/** Normalize an amount to a monthly cost for spend calculations */
export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'daily':      return amount * 30.44
    case 'weekly':     return amount * 4.33
    case 'biweekly':   return amount * 2.17
    case 'monthly':    return amount
    case 'quarterly':  return amount / 3
    case 'semiannual': return amount / 6
    case 'annual':     return amount / 12
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
