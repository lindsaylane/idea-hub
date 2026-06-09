-- Run this in your Supabase SQL editor to create the ideas table

create table if not exists ideas (
  id           text primary key,
  transcription text not null,
  summary      text not null,
  value        text not null,
  reasoning    text not null,
  starter_prompt text not null,
  created_at   timestamptz not null default now()
);

-- Optional: enable Row Level Security (RLS)
-- For a personal app you can leave it open, or lock it down below

-- alter table ideas enable row level security;

-- If you enable RLS, add a policy to allow all operations from the service role:
-- create policy "service role full access" on ideas
--   using (true)
--   with check (true);

-- Index for faster sorting by date
create index if not exists ideas_created_at_idx on ideas (created_at desc);
