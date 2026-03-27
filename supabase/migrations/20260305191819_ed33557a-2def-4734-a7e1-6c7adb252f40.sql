
-- Migrate existing 'user' roles to 'corretor'
UPDATE public.user_roles SET role = 'corretor' WHERE role = 'user';

-- Create function to get visible user IDs based on role hierarchy
CREATE OR REPLACE FUNCTION public.get_visible_user_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id FROM public.profiles p
  WHERE public.is_master_user(_user_id)
  UNION
  SELECT _user_id WHERE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'gerente')
  UNION
  SELECT p.user_id FROM public.profiles p
  WHERE p.manager_id = _user_id
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'gerente')
  UNION
  SELECT _user_id
$$;

-- Create function to check visibility
CREATE OR REPLACE FUNCTION public.can_see_user(_viewer_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_visible_user_ids(_viewer_id) WHERE get_visible_user_ids = _target_user_id
  )
$$;

-- Update auto_assign to use 'corretor'
CREATE OR REPLACE FUNCTION public.auto_assign_master_role()
RETURNS trigger
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
        VALUES (NEW.id, 'corretor')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;
