import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Client } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface AppointmentWithClient extends Appointment {
  clients?: Client | null;
}

export function useAppointments(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  // Escutar mudanças em tempo real na tabela appointments
  useRealtimeSubscription({
    table: 'appointments',
    queryKeys: [['appointments']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['appointments', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<AppointmentWithClient[]> => {
      let query = supabase
        .from('appointments')
        .select('*, clients(*)')
        .order('start_time', { ascending: true });

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AppointmentWithClient[];
    },
    enabled: !!user,
  });
}

export function useClientAppointments(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', 'client', clientId],
    queryFn: async (): Promise<AppointmentWithClient[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as AppointmentWithClient[];
    },
    enabled: !!user && !!clientId,
  });
}

interface CreateAppointmentData {
  title: string;
  description?: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  type: string;
  location?: string;
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newAppointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('Compromisso agendado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao agendar compromisso: ' + error.message);
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('Compromisso atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar compromisso: ' + error.message);
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments'] });
      toast.success('Compromisso excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir compromisso: ' + error.message);
    },
  });
}
