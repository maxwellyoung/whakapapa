-- Fix the profile creation trigger to be more resilient
-- Run this in Supabase Dashboard SQL Editor if the trigger is causing signup failures

-- First, drop the existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create a more resilient version of the function
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Use INSERT ... ON CONFLICT to handle any race conditions
  insert into public.profiles (id, full_name, avatar_url)
  values (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Always return NEW to allow the user creation to succeed
  return NEW;
exception
  when others then
    -- Log the error but don't fail the user creation
    -- The profile can be created later via the auth callback
    raise warning 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    return NEW;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
