import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface Lancamento {
  id: string;
  nome: string;
  construtora: string | null;
  descricao: string | null;
  status: string;
  tipo: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  numero: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  previsao_entrega: string | null;
  valor_min: number | null;
  valor_max: number | null;
  area_min: number | null;
  area_max: number | null;
  quartos_min: number | null;
  quartos_max: number | null;
  suites_min: number | null;
  suites_max: number | null;
  vagas_min: number | null;
  vagas_max: number | null;
  andares: number | null;
  unidades_por_andar: number | null;
  total_unidades: number | null;
  area_lazer: string[];
  diferenciais: string[];
  plantas: any[];
  fotos: string[];
  logo_url: string | null;
  website_url: string | null;
  video_url: string | null;
  comissao_percentual: number;
  forma_pagamento: string[] | null;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useLancamentos() {
  const { user } = useAuth();

  useRealtimeSubscription({
    table: 'lancamentos' as any,
    queryKeys: [['lancamentos']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['lancamentos'],
    queryFn: async (): Promise<Lancamento[]> => {
      const { data, error } = await (supabase as any)
        .from('lancamentos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Lancamento[];
    },
    enabled: !!user,
  });
}

export function useCreateLancamento() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<Lancamento> & { nome: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: result, error } = await (supabase as any)
        .from('lancamentos')
        .insert({ ...data, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Lançamento criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar lançamento: ' + error.message);
    },
  });
}

export function useUpdateLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Lancamento> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('lancamentos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Lançamento atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export function useDeleteLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('lancamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast.success('Lançamento excluído!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });
}
