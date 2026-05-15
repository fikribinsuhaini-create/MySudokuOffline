# Supabase Setup (Magic Link Sync)

This project can sync progress (`resume` + completed levels) across devices using Supabase Auth + Postgres.

## 1) Auth settings

In Supabase Dashboard:

- Authentication → URL Configuration
  - Site URL: `https://my-sudoku-offline.vercel.app`
  - Redirect URLs: `https://my-sudoku-offline.vercel.app/*`

Enable Email provider (magic link).

## 2) Create table + RLS

Run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.sudoku_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_game jsonb,
  completed_levels jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sudoku_saves enable row level security;

create policy "read own save"
  on public.sudoku_saves for select
  using (auth.uid() = user_id);

create policy "upsert own save"
  on public.sudoku_saves for insert
  with check (auth.uid() = user_id);

create policy "update own save"
  on public.sudoku_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 3) Frontend keys

The app uses:

- `SUPABASE_URL`: `https://fqbyuciszppdfgnisspi.supabase.co`
- `SUPABASE_ANON_KEY`: stored in `assets/js/app.js`

These are public keys (safe to ship). Never put `service_role` key in frontend.

