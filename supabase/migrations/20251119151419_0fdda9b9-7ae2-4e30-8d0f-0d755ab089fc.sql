-- Fix RLS policies to restrict data access properly

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Profiles: Users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- Profiles: Only admins can insert profiles
CREATE POLICY "Admins can create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Activity logs: Users can only view their own logs, admins can view all
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Activity logs: Only system/backend can insert (restrict to service role or admin)
CREATE POLICY "Only admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User roles: Users can only view their own role, admins can view all
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Attendance: Update policies to ensure only admins can mark attendance
DROP POLICY IF EXISTS "Users can create own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update own today's attendance" ON public.attendance;

-- Only admins can create attendance records
CREATE POLICY "Admins can create attendance"
ON public.attendance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update attendance records
CREATE POLICY "Admins can update attendance"
ON public.attendance
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));