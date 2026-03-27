import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  deal_id: string | null;
  due_date: string;
  status: string;
  type: string;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  client?: { id: string; name: string } | null;
  deal?: { id: string; title: string | null; bairro: string | null } | null;
}

export function useTasks() {
  const { user } = useAuth();

  useRealtimeSubscription({
    table: 'tasks' as any,
    queryKeys: [['tasks']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*, client:clients(id, name), deal:deals(id, title, bairro)')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!user,
  });
}

export function useClientTasks(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', 'client', clientId],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*, deal:deals(id, title, bairro)')
        .eq('client_id', clientId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!user && !!clientId,
  });
}

export function useDealTasks(dealId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', 'deal', dealId],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*, client:clients(id, name)')
        .eq('deal_id', dealId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!user && !!dealId,
  });
}

interface CreateTaskData {
  title: string;
  description?: string;
  client_id?: string;
  deal_id?: string;
  due_date: string;
  type?: string;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: task, error } = await (supabase as any)
        .from('tasks')
        .insert({ ...data, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Log interaction on deal if linked
      if (data.deal_id) {
        await supabase.from('deal_interactions').insert({
          deal_id: data.deal_id,
          type: 'created',
          description: `Tarefa criada: "${data.title}" - Prazo: ${new Date(data.due_date).toLocaleDateString('pt-BR')}`,
          created_by: user.id,
        });
      }

      return task;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'client', data.client_id] });
      }
      if (data.deal_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'deal', data.deal_id] });
        queryClient.invalidateQueries({ queryKey: ['deal-interactions', data.deal_id] });
      }

      toast.success('Tarefa criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, client_id, deal_id, title }: { id: string; client_id?: string | null; deal_id?: string | null; title: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Log completion on client
      if (client_id) {
        await supabase.from('client_interactions').insert({
          client_id,
          type: 'meeting' as const,
          notes: `Tarefa concluída: "${title}"`,
          created_by: user.id,
        });
      }

      // Log completion on deal
      if (deal_id) {
        await supabase.from('deal_interactions').insert({
          deal_id,
          type: 'stage_change',
          description: `Tarefa concluída: "${title}"`,
          created_by: user.id,
        });
      }
    },
    onSuccess: (_, { client_id, deal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (client_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'client', client_id] });
        queryClient.invalidateQueries({ queryKey: ['client-interactions', client_id] });
      }
      if (deal_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'deal', deal_id] });
        queryClient.invalidateQueries({ queryKey: ['deal-interactions', deal_id] });
      }
      toast.success('Tarefa concluída!');
    },
    onError: (error) => {
      toast.error('Erro ao concluir tarefa: ' + error.message);
    },
  });
}

interface UpdateTaskData {
  id: string;
  title?: string;
  description?: string | null;
  client_id?: string | null;
  deal_id?: string | null;
  due_date?: string;
  type?: string;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTaskData) => {
      const { error } = await (supabase as any)
        .from('tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir tarefa: ' + error.message);
    },
  });
}

// Task type options
export const TASK_TYPE_OPTIONS = [
  { value: 'visita', label: 'Visita', icon: '🏠' },
  { value: 'ligacao', label: 'Ligação', icon: '📞' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'email', label: 'E-mail', icon: '📧' },
  { value: 'reuniao', label: 'Reunião', icon: '🤝' },
  { value: 'documentacao', label: 'Documentação', icon: '📄' },
  { value: 'other', label: 'Outro', icon: '📌' },
];

export function getTaskTypeLabel(type: string) {
  return TASK_TYPE_OPTIONS.find(t => t.value === type) || TASK_TYPE_OPTIONS[TASK_TYPE_OPTIONS.length - 1];
}

// Helper to calculate deadline status
export function getDeadlineInfo(dueDate: string, status: string) {
  if (status === 'completed') return { label: 'Concluída', variant: 'completed' as const };
  
  const now = new Date();
  const due = new Date(dueDate);
  
  // Normalize to day boundaries (start of day in local timezone)
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  const diffMs = dueDay.getTime() - nowDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Vencido há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`, variant: 'overdue' as const };
  } else if (diffDays === 0) {
    return { label: 'Vence hoje', variant: 'today' as const };
  } else {
    return { label: `Faltam ${diffDays} dia${diffDays !== 1 ? 's' : ''}`, variant: 'ontime' as const };
  }
}
