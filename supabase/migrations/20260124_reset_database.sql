-- DANGER: This will delete ALL data from the application
truncate table public.leads cascade;
truncate table public.panels cascade;
truncate table public.profiles cascade;

-- Note: To fully reset the login, you must also delete the user from 
-- Authentication -> Users in the Supabase Dashboard.
