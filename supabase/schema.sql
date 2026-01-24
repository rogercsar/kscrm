-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- PANELS
create table public.panels (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.panels enable row level security;

create policy "Users can view their own panels."
  on panels for select
  using ( auth.uid() = user_id );

create policy "Users can create their own panels."
  on panels for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own panels."
  on panels for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own panels."
  on panels for delete
  using ( auth.uid() = user_id );

-- LEADS
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  panel_id uuid references public.panels(id) on delete cascade not null,
  original_data jsonb not null default '{}'::jsonb,
  selected_columns text[] not null default '{}',
  status text not null default 'cold',
  scheduled_date timestamp with time zone,
  lost_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leads enable row level security;

-- Leads policies rely on the user having access to the parent panel.
-- We can check this by joining with the panels table or simply trusting that
-- if a user can see the panel, they can see the leads (simplified RLS)

create policy "Users can view leads of their panels"
  on leads for select
  using (
    exists (
      select 1 from panels
      where panels.id = leads.panel_id
      and panels.user_id = auth.uid()
    )
  );

create policy "Users can insert leads into their panels"
  on leads for insert
  with check (
    exists (
      select 1 from panels
      where panels.id = leads.panel_id
      and panels.user_id = auth.uid()
    )
  );

create policy "Users can update leads of their panels"
  on leads for update
  using (
    exists (
      select 1 from panels
      where panels.id = leads.panel_id
      and panels.user_id = auth.uid()
    )
  );

create policy "Users can delete leads of their panels"
  on leads for delete
  using (
    exists (
      select 1 from panels
      where panels.id = leads.panel_id
      and panels.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
