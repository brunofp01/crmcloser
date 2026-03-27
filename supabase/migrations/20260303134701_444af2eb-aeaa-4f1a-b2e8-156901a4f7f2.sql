
-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own tasks, master sees all
CREATE POLICY "Users can view own tasks or master all"
ON public.tasks FOR SELECT TO authenticated
USING (is_master_user(auth.uid()) OR created_by = auth.uid());

-- RLS: Users can create their own tasks
CREATE POLICY "Users can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- RLS: Users can update their own tasks, master can update all
CREATE POLICY "Users can update own tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (is_master_user(auth.uid()) OR created_by = auth.uid());

-- RLS: Users can delete their own tasks, master can delete all
CREATE POLICY "Users can delete own tasks"
ON public.tasks FOR DELETE TO authenticated
USING (is_master_user(auth.uid()) OR created_by = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
