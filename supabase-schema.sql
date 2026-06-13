-- ============================================================
-- SubTracker Database Schema
-- Run this entire file in Supabase → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles table (auto-created on user signup via trigger)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  reminder_email text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Subscriptions table
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric(10, 2) not null default 0,
  currency text not null default 'USD',
  billing_cycle text not null check (billing_cycle in (
    'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'
  )),
  next_billing_date date not null,
  category text not null default 'other' check (category in (
    'streaming', 'software', 'utilities', 'health', 'finance', 'food', 'gaming', 'news', 'storage', 'other'
  )),
  reminder_days integer[] not null default '{7,3,1}',
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on subscriptions for select using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on subscriptions for update using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on subscriptions for delete using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, reminder_email)
  values (new.id, new.email, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Reminder log (prevents duplicate emails)
create table reminder_log (
  id uuid default uuid_generate_v4() primary key,
  subscription_id uuid references subscriptions on delete cascade not null,
  days_before integer not null,
  sent_at timestamptz default now(),
  billing_date date not null,
  unique(subscription_id, days_before, billing_date)
);

alter table reminder_log enable row level security;

create policy "Service role only"
  on reminder_log for all using (false);
