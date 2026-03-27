
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('master', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is master by email
CREATE OR REPLACE FUNCTION public.is_master_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'brunofp01@gmail.com'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.is_master_user(auth.uid()));

CREATE POLICY "Only master can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_master_user(auth.uid()));

CREATE POLICY "Only master can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_master_user(auth.uid()));

CREATE POLICY "Only master can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_master_user(auth.uid()));

-- Add new stages to client_stage enum
ALTER TYPE public.client_stage ADD VALUE 'quarantine';
ALTER TYPE public.client_stage ADD VALUE 'lost';

-- Add new interaction types for automatic logging
ALTER TYPE public.interaction_type ADD VALUE 'stage_change';

-- Update clients RLS policies to support master user access and assigned_to
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
CREATE POLICY "Users can view their own or assigned clients, master sees all"
ON public.clients
FOR SELECT
USING (
    public.is_master_user(auth.uid()) 
    OR created_by = auth.uid() 
    OR assigned_to = auth.uid()
);

-- Keep update policy for all users
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
USING (
    public.is_master_user(auth.uid()) 
    OR created_by = auth.uid() 
    OR assigned_to = auth.uid()
);

-- Only master can delete clients
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
CREATE POLICY "Only master can delete clients"
ON public.clients
FOR DELETE
USING (public.is_master_user(auth.uid()));

-- Update client_interactions RLS to allow viewing for related clients
DROP POLICY IF EXISTS "Authenticated users can view all interactions" ON public.client_interactions;
CREATE POLICY "Users can view interactions for their clients"
ON public.client_interactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_id 
        AND (
            public.is_master_user(auth.uid()) 
            OR c.created_by = auth.uid() 
            OR c.assigned_to = auth.uid()
        )
    )
);

-- Add whatsapp column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update profiles RLS to allow master to view and manage all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Allow master to update any profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile or master can update any"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id OR public.is_master_user(auth.uid()));

-- Allow master to delete profiles
CREATE POLICY "Only master can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_master_user(auth.uid()));

-- Create trigger to auto-create master role for brunofp01@gmail.com
CREATE OR REPLACE FUNCTION public.auto_assign_master_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email = 'brunofp01@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'master')
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'user')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_master_role();
