-- Add phone column to profiles
alter table public.profiles add column if not exists phone text;

-- STORAGE POLICIES (Avatars)
-- Ensure the bucket exists (this usually needs to be done via dashboard, but we can try to set policies)
-- Assuming 'avatars' bucket exists.

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
  
create policy "Anyone can update an avatar."
  on storage.objects for update
  with check ( bucket_id = 'avatars' );

-- SHARED ACCESS POLICIES (Panels & Leads)
-- We want ALL authenticated users to see/edit ALL panels/leads.

-- Drop existing restrictive policies
drop policy if exists "Users can view their own panels." on panels;
drop policy if exists "Users can create their own panels." on panels;
drop policy if exists "Users can update their own panels." on panels;
drop policy if exists "Users can delete their own panels." on panels;

-- Create new "Shared" policies for Panels
create policy "Authenticated users can view all panels"
  on panels for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert panels"
  on panels for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update all panels"
  on panels for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete all panels"
  on panels for delete
  using ( auth.role() = 'authenticated' );

-- Update Leads policies (simplifying to allow access if user is authenticated)
drop policy if exists "Users can view leads of their panels" on leads;
drop policy if exists "Users can insert leads into their panels" on leads;
drop policy if exists "Users can update leads of their panels" on leads;
drop policy if exists "Users can delete leads of their panels" on leads;

create policy "Authenticated users can view all leads"
  on leads for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert all leads"
  on leads for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update all leads"
  on leads for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete all leads"
  on leads for delete
  using ( auth.role() = 'authenticated' );
