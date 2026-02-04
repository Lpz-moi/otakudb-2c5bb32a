-- This migration removes all database objects related to the "friends" feature.

-- Drop policies that depend on the are_friends function
DROP POLICY IF EXISTS "Users can view friends profiles" ON public.profiles;
DROP POLICY IF EXISTS "Friends can view shared anime lists" ON public.anime_lists;
DROP POLICY IF EXISTS "Friends can view activities" ON public.activity_log;

-- Drop policies on the friendships table itself before dropping the table
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;

-- Drop the function that checks for friendships
DROP FUNCTION IF EXISTS public.are_friends(uuid, uuid);

-- Drop the friendships table
DROP TABLE IF EXISTS public.friendships;

-- The following steps remove the 'friends_only' option from the 'share_permission' ENUM type.
-- This is a multi-step process as ENUMs cannot be altered directly in this way.

-- 1. Rename the existing ENUM type to preserve it temporarily.
ALTER TYPE public.share_permission RENAME TO old_share_permission;

-- 2. Create the new ENUM type without the 'friends_only' option.
CREATE TYPE public.share_permission AS ENUM ('none', 'public');

-- 3. Update the 'profiles' table columns that use this type.
-- First, alter the columns to use TEXT as an intermediate type to hold the old values.
ALTER TABLE public.profiles
  ALTER COLUMN share_watching TYPE TEXT,
  ALTER COLUMN share_completed TYPE TEXT,
  ALTER COLUMN share_planned TYPE TEXT,
  ALTER COLUMN share_favorites TYPE TEXT;

-- 4. Update the actual data, converting 'friends_only' to a safe default ('none').
UPDATE public.profiles
SET
  share_watching = CASE WHEN share_watching = 'friends_only' THEN 'none' ELSE share_watching END,
  share_completed = CASE WHEN share_completed = 'friends_only' THEN 'none' ELSE share_completed END,
  share_planned = CASE WHEN share_planned = 'friends_only' THEN 'none' ELSE share_planned END,
  share_favorites = CASE WHEN share_favorites = 'friends_only' THEN 'none' ELSE share_favorites END;

-- 5. Cast the columns back to the new 'share_permission' type.
ALTER TABLE public.profiles
  ALTER COLUMN share_watching TYPE public.share_permission USING share_watching::public.share_permission,
  ALTER COLUMN share_completed TYPE public.share_permission USING share_completed::public.share_permission,
  ALTER COLUMN share_planned TYPE public.share_permission USING share_planned::public.share_permission,
  ALTER COLUMN share_favorites TYPE public.share_permission USING share_favorites::public.share_permission;

-- 6. Restore the default values for the columns.
ALTER TABLE public.profiles
  ALTER COLUMN share_watching SET DEFAULT 'none',
  ALTER COLUMN share_completed SET DEFAULT 'none',
  ALTER COLUMN share_planned SET DEFAULT 'none',
  ALTER COLUMN share_favorites SET DEFAULT 'none';

-- 7. Finally, drop the old, renamed ENUM type.
DROP TYPE public.old_share_permission;
