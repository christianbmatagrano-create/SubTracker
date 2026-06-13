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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">SubTracker</span>
        </div>
      </header>

      {/* Hero + Auth */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 px-6 py-12 max-w-6xl mx-auto w-full">
        {/* Left — copy */}
        <div className="flex-1 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
            Free forever
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Know what you pay.<br />
            <span className="text-brand-400">Before it hits.</span>
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Add every subscription once. Get email reminders 7 days, 3 days, and 1 day before each billing date — so you&apos;re never caught off guard.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'All billing cycles — daily through annual',
              'Email reminders at any interval you choose',
              'Monthly spend overview across all subs',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-blue-200 text-sm">
                <svg className="w-4 h-4 text-brand-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                </svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right — auth form */}
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </main>
    </div>
  )
}
