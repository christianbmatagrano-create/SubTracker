import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { advanceBillingDate } from '@/lib/billing'

// GET /api/subscriptions — list all active subs for the authenticated user
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(auth.replace('Bearer ', ''))
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('next_billing_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/subscriptions/advance/:id — advance billing date by one period
// (called after a billing event to reset the next_billing_date)
