'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/AuthForm'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col overflow-hidden">

      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(79,102,247,0.18) 0%, transparent 70%)' }} />

      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SubTracker</span>
        </div>
        <div className="text-slate-500 text-sm font-medium">Free forever</div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-20 px-6 py-12 max-w-6xl mx-auto w-full">

        <div className="flex-1 max-w-xl">

          <div className="inline-flex items-center gap-2 mb-7">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-400 text-xs font-semibold uppercase tracking-widest">No credit card required</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 tracking-tight">
            Stop getting<br />
            <span className="text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)'}}>
              surprised
            </span>{' '}by bills.
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
            One place for every subscription you pay for. Get an email before each billing date so you can cancel what you forgot about.
          </p>

          <div className="flex items-center gap-8 mb-10">
            {[
              { number: '7', label: 'Billing cycles' },
              { number: '∞', label: 'Subscriptions' },
              { number: '0', label: 'Cost to you' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-black text-white">{s.number}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: '📧', text: 'Email reminders 7, 3, and 1 day before billing' },
              { icon: '✅', text: 'Mark subscriptions as paid to reset the countdown' },
              { icon: '📊', text: 'See your true monthly and annual spend at a glance' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0">📺</div>
            <div className="flex-1">
              <div className="text-white text-sm font-semibold">Netflix</div>
              <div className="text-slate-500 text-xs">Bills in 3 days</div>
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-bold">$22.99</div>
              <div className="text-amber-400 text-xs font-medium">Soon</div>
            </div>
          </div>
          <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0">💻</div>
            <div className="flex-1">
              <div className="text-white text-sm font-semibold">GitHub Pro</div>
              <div className="text-slate-500 text-xs">Bills in 18 days</div>
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-bold">$4.00</div>
              <div className="text-green-400 text-xs font-medium">✓ Paid</div>
            </div>
          </div>

          <AuthForm />
        </div>
      </main>
    </div>
  )
}