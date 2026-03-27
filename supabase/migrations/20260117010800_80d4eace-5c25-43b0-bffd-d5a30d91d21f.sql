-- Drop the incorrect foreign key
ALTER TABLE public.clients DROP CONSTRAINT clients_assigned_to_fkey;

-- Add the correct foreign key referencing profiles.user_id
ALTER TABLE public.clients 
ADD CONSTRAINT clients_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id) ON DELETE SET NULL;