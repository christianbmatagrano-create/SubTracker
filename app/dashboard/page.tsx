'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Subscription } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toMonthlyAmount, formatCurrency, daysUntil } from '@/lib/billing'
import SubCard from '@/components/SubCard'
import AddSubModal from '@/components/AddSubModal'
import SettingsModal from '@/components/SettingsModal'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const router = useRouter()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [filter, setFilter] = useState<'all' | 'upcoming'>('all')

  const fetchSubs = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .order('next_billing_date', { ascending: true })

    if (error) {
      toast.error('Failed to load subscriptions')
    } else {
      setSubs(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/')
      } else {
        setUserEmail(session.user.email ?? '')
        fetchSubs()
      }
    })
  }, [router, fetchSubs])

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete subscription')
    } else {
      setSubs(prev => prev.filter(s => s.id !== id))
      toast.success('Subscription removed')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // Stats
  const monthlyTotal = subs.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billing_cycle), 0)
  const upcoming7 = subs.filter(s => {
    const d = daysUntil(s.next_billing_date)
    return d >= 0 && d <= 7
  })
  const annualTotal = monthlyTotal * 12

  const displayedSubs = filter === 'upcoming' ? upcoming7 : subs

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900">SubTracker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Settings"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Sign out"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Monthly spend" value={formatCurrency(monthlyTotal)} />
          <StatCard label="Annual spend" value={formatCurrency(annualTotal)} />
          <StatCard label="Active subs" value={String(subs.length)} />
          <StatCard
            label="Due this week"
            value={String(upcoming7.length)}
            highlight={upcoming7.length > 0}
          />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {(['all', 'upcoming'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f === 'all' ? 'All' : 'This week'}
                {f === 'upcoming' && upcoming7.length > 0 && (
                  <span className="ml-1.5 bg-brand-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {upcoming7.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add subscription
          </button>
        </div>

        {/* Subs list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedSubs.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {filter === 'upcoming' ? 'No subscriptions due this week' : 'No subscriptions yet'}
            </p>
            {filter === 'all' && (
              <button onClick={() => setShowAdd(true)} className="mt-4 btn-secondary">
                Add your first subscription
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedSubs.map(sub => (
              <SubCard
                key={sub.id}
                sub={sub}
                onEdit={() => setEditSub(sub)}
                onDelete={() => handleDelete(sub.id)}
onRefresh={fetchSubs}
              />
            ))}
          </div>
        )}
      </main>

      {(showAdd || editSub) && (
        <AddSubModal
          existing={editSub ?? undefined}
          onClose={() => { setShowAdd(false); setEditSub(null) }}
          onSaved={() => { setShowAdd(false); setEditSub(null); fetchSubs() }}
        />
      )}

      {showSettings && (
        <SettingsModal
          userEmail={userEmail}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? 'border-amber-200 bg-amber-50' : ''}`}>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${highlight ? 'text-amber-600' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
