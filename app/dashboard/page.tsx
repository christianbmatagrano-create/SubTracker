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
  const [dark, setDark] = useState(true)

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

  const monthlyTotal = subs.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billing_cycle), 0)
  const upcoming7 = subs.filter(s => { const d = daysUntil(s.next_billing_date); return d >= 0 && d <= 7 })
  const annualTotal = monthlyTotal * 12
  const displayedSubs = filter === 'upcoming' ? upcoming7 : subs

  const bg = dark ? 'bg-[#0a0f1e]' : 'bg-gray-50'
  const navBg = dark ? 'bg-[#0d1428]/80' : 'bg-white/80'
  const navBorder = dark ? 'border-slate-700/50' : 'border-gray-200'
  const cardBg = dark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-gray-200'
  const textPri = dark ? 'text-white' : 'text-gray-900'
  const textSec = dark ? 'text-slate-400' : 'text-gray-500'
  const textMuted = dark ? 'text-slate-500' : 'text-gray-400'
  const filterBg = dark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-gray-200'
  const filterActive = dark ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-white'
  const filterInactive = dark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
  const emptyBg = dark ? 'bg-slate-800/40' : 'bg-gray-100'

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>

      {dark && (
        <>
          <div className="fixed inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />
          <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(79,102,247,0.12) 0%, transparent 70%)' }} />
        </>
      )}

      <nav className={`${navBg} ${navBorder} border-b sticky top-0 z-30 backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className={`font-bold ${textPri}`}>SubTracker</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm ${textMuted} hidden sm:block`}>{userEmail}</span>

            <button
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-lg transition-colors ${dark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              )}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg transition-colors ${dark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Settings"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </button>

            <button
              onClick={handleSignOut}
              className={`p-2 rounded-lg transition-colors ${dark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Sign out"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Monthly spend', value: formatCurrency(monthlyTotal) },
            { label: 'Annual spend', value: formatCurrency(annualTotal) },
            { label: 'Active subs', value: String(subs.length) },
            { label: 'Due this week', value: String(upcoming7.length), highlight: upcoming7.length > 0 },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-5 ${s.highlight ? (dark ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200') : cardBg}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${s.highlight ? (dark ? 'text-amber-400' : 'text-amber-600') : textMuted}`}>
                {s.label}
              </p>
              <p className={`text-2xl font-black ${s.highlight ? (dark ? 'text-amber-300' : 'text-amber-700') : textPri}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className={`flex items-center gap-1 border rounded-xl p-1 ${filterBg}`}>
            {(['all', 'upcoming'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? filterActive : filterInactive}`}
              >
                {f === 'all' ? 'All' : 'This week'}
                {f === 'upcoming' && upcoming7.length > 0 && (
                  <span className="ml-1.5 bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {upcoming7.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-4 py-2 text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/30"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add subscription
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedSubs.length === 0 ? (
          <div className={`rounded-2xl border p-16 text-center ${cardBg}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${emptyBg}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-6 h-6 ${textMuted}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
            </div>
            <p className={`text-sm ${textSec}`}>
              {filter === 'upcoming' ? 'No subscriptions due this week' : 'No subscriptions yet'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowAdd(true)}
                className={`mt-4 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
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
                dark={dark}
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