import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientStage, ClientPriority, ClientInteraction, InteractionType } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export function useClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useRealtimeSubscription({
    table: 'clients',
    queryKeys: [['clients']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useClient(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', id],
    queryFn: async (): Promise<Client | null> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!user && !!id,
  });
}

export function useClientInteractions(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-interactions', clientId],
    queryFn: async (): Promise<ClientInteraction[]> => {
      const { data, error } = await supabase
        .from('client_interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientInteraction[];
    },
    enabled: !!user && !!clientId,
  });
}

interface CreateClientData {
  name: string;
  email?: string;
  phone: string;
  stage?: ClientStage;
  priority?: ClientPriority;
  source?: string;
  budget?: string;
  preferred_region?: string;
  property_type?: string;
  notes?: string;
  assigned_to?: string;
  budget_max?: number;
  budget_min?: number;
  bedrooms_min?: number;
  parking_min?: number;
  area_min?: number;
  property_types?: string[];
  transaction_type?: string;
  needs_leisure?: boolean;
  leisure_features?: string[];
  region_flexible?: boolean;
  urgencia?: string;
  finalidade?: string;
  forma_pagamento?: string[];
  elevator_preference?: string;
  cidades?: string[];
  is_investidor?: boolean;
  portaria_preferencia?: string[];
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-broker'] });
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar cliente: ' + error.message);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-broker'] });
      queryClient.invalidateQueries({ queryKey: ['client-with-broker', data.id] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    },
  });
}

export function useUpdateClientStage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, stage, previousStage, notes }: { id: string; stage: ClientStage; previousStage?: ClientStage; notes?: string }) => {
      const { data: updated, error } = await supabase
        .from('clients')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (user && previousStage && previousStage !== stage) {
        const stageLabels: Record<string, string> = {
          lead: 'Novo Lead', qualification: 'Qualificação', contact: 'Perfil Definido', visit: 'Visita Agendada',
          proposal: 'Proposta Enviada', negotiation: 'Em Negociação', closed: 'Fechado',
          quarantine: 'Quarentena', lost: 'Desistência',
        };
        
        const autoNote = `Movido de "${stageLabels[previousStage]}" para "${stageLabels[stage]}"`;
        const fullNote = notes ? `${autoNote}\n\nMotivo: ${notes}` : autoNote;
        
        await supabase.from('client_interactions').insert({
          client_id: id,
          type: 'stage_change',
          notes: fullNote,
          created_by: user.id,
        });
      }

      return updated;
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previousClients = queryClient.getQueryData<Client[]>(['clients']);
      if (previousClients) {
        queryClient.setQueryData<Client[]>(['clients'], (old) =>
          old?.map((client) => client.id === id ? { ...client, stage } : client) ?? []
        );
      }
      return { previousClients };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-broker'] });
      queryClient.invalidateQueries({ queryKey: ['client-with-broker', data.id] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
      queryClient.invalidateQueries({ queryKey: ['client-interactions'] });
      toast.success('Estágio atualizado com sucesso!');
    },
    onError: (error, _variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients'], context.previousClients);
      }
      toast.error('Erro ao mover cliente: ' + error.message);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-broker'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir cliente: ' + error.message);
    },
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { client_id: string; type: InteractionType; notes?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: interaction, error } = await supabase
        .from('client_interactions')
        .insert({ ...data, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      return interaction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-interactions', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['all-interactions'] });
      toast.success('Interação registrada!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar interação: ' + error.message);
    },
  });
}
