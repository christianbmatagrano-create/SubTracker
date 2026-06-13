import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'user_id'>>
      }
      profiles: {
        Row: Profile
        Insert: Profile
        Update: Partial<Profile>
      }
    }
  }
}

export type BillingCycle =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'

export type Category =
  | 'streaming'
  | 'software'
  | 'utilities'
  | 'health'
  | 'finance'
  | 'food'
  | 'gaming'
  | 'news'
  | 'storage'
  | 'other'

export type Subscription = {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_billing_date: string
  category: Category
  reminder_days: number[]
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string
  reminder_email: string | null
  created_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side admin client (bypasses RLS — only use in API routes/cron)
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
