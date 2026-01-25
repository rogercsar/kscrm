-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the handle_new_user trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attempt to backfill existing profiles with emails from auth.users
-- This requires the executor to have permissions on auth.users
DO $$
BEGIN
  UPDATE public.profiles
  SET email = users.email
  FROM auth.users
  WHERE profiles.id = users.id
  AND profiles.email IS NULL;
END $$;
