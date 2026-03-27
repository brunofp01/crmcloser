import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Deal, DealClient, DealClientStage, DealProposal, DealInteraction, DealPartner, DealWithClients } from '@/types/deal';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export function useDeals() {
  const { user } = useAuth();

  useRealtimeSubscription({
    table: 'deals',
    queryKeys: [['deals']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['deals'],
    queryFn: async (): Promise<DealWithClients[]> => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, deal_clients(*, client:clients(id, name, phone, email)), deal_proposals(id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        area_lazer: (d.area_lazer as string[]) || [],
        status: d.status as Deal['status'],
        proposals_count: (d.deal_proposals || []).length,
        deal_clients: (d.deal_clients || []).map((dc: any) => ({
          ...dc,
          stage: dc.stage as DealClientStage,
        })),
      }));
    },
    enabled: !!user,
  });
}

export function useDeal(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deals', id],
    queryFn: async (): Promise<Deal | null> => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        area_lazer: (data.area_lazer as string[]) || [],
        status: data.status as Deal['status'],
      };
    },
    enabled: !!user && !!id,
  });
}

export function useDealClients(dealId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal-clients', dealId],
    queryFn: async (): Promise<DealClient[]> => {
      const { data, error } = await supabase
        .from('deal_clients')
        .select('*, client:clients(id, name, phone, email)')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((dc: any) => ({
        ...dc,
        stage: dc.stage as DealClientStage,
      }));
    },
    enabled: !!user && !!dealId,
  });
}

export function useDealProposals(dealId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal-proposals', dealId],
    queryFn: async (): Promise<DealProposal[]> => {
      const { data, error } = await supabase
        .from('deal_proposals')
        .select('*, client:clients(id, name)')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        composicao: (p.composicao as any[]) || [],
      }));
    },
    enabled: !!user && !!dealId,
  });
}

export function useDealInteractions(dealId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal-interactions', dealId],
    queryFn: async (): Promise<DealInteraction[]> => {
      const { data, error } = await supabase
        .from('deal_interactions')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((i: any) => ({
        ...i,
        metadata: (i.metadata as Record<string, any>) || {},
      }));
    },
    enabled: !!user && !!dealId,
  });
}

export function useDealPartners(dealId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deal-partners', dealId],
    queryFn: async (): Promise<DealPartner[]> => {
      const { data, error } = await supabase
        .from('deal_partners')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!dealId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<Deal> & { partners?: Omit<DealPartner, 'id' | 'deal_id' | 'created_at'>[] }) => {
      if (!user) throw new Error('Not authenticated');
      const { partners, ...dealData } = data;

      const { data: newDeal, error } = await supabase
        .from('deals')
        .insert({ ...dealData, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Insert partners if any
      if (partners && partners.length > 0) {
        const { error: partnerError } = await supabase
          .from('deal_partners')
          .insert(partners.map(p => ({ ...p, deal_id: newDeal.id })));
        if (partnerError) console.error('Error adding partners:', partnerError);
      }

      // Log interaction
      await supabase.from('deal_interactions').insert({
        deal_id: newDeal.id,
        type: 'created',
        description: `Negócio criado: ${dealData.title || 'Sem título'}`,
        created_by: user.id,
      });

      return newDeal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] });
      queryClient.invalidateQueries({ queryKey: ['deal-interactions', data.id] });
      toast.success('Negócio cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar negócio: ' + error.message);
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deal> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', data.id] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar negócio: ' + error.message);
    },
  });
}

export function useLinkClientToDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ deal_id, client_id }: { deal_id: string; client_id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deal_clients')
        .insert({ deal_id, client_id, created_by: user.id })
        .select('*, client:clients(id, name)')
        .single();

      if (error) throw error;

      // Log interaction
      await supabase.from('deal_interactions').insert({
        deal_id,
        type: 'client_linked',
        description: `Cliente "${(data as any).client?.name}" vinculado ao negócio`,
        metadata: { client_id },
        created_by: user.id,
      });

      // Log client interaction
      const { data: dealData } = await supabase.from('deals').select('codigo_imovel, bairro, cidade, valor, metragem, quartos, vagas').eq('id', deal_id).single();
      const parts: string[] = [];
      if (dealData?.codigo_imovel) parts.push(`Cód: ${dealData.codigo_imovel}`);
      if (dealData?.bairro) parts.push(dealData.bairro);
      if (dealData?.cidade) parts.push(dealData.cidade);
      if (dealData?.valor) parts.push(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(dealData.valor)));
      if (dealData?.metragem) parts.push(`${dealData.metragem}m²`);
      if (dealData?.quartos) parts.push(`${dealData.quartos} qts`);
      if (dealData?.vagas) parts.push(`${dealData.vagas} vg`);
      const dealInfo = parts.length > 0 ? parts.join(', ') : 'Sem dados';
      await supabase.from('client_interactions').insert({
        client_id,
        type: 'stage_change' as const,
        notes: `Vinculado ao imóvel (${dealInfo})`,
        created_by: user.id,
      });

      return data;
    },
    onSuccess: (_, { deal_id, client_id }) => {
      queryClient.invalidateQueries({ queryKey: ['deal-clients', deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deal-interactions', deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['client-interactions', client_id] });
      toast.success('Cliente vinculado ao negócio!');
    },
    onError: (error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este cliente já está vinculado a este negócio.');
      } else {
        toast.error('Erro ao vincular cliente: ' + error.message);
      }
    },
  });
}

export function useUpdateDealClientStage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, stage, previousStage, deal_id, client_name, client_id, notes }: {
      id: string;
      stage: DealClientStage;
      previousStage?: DealClientStage;
      deal_id: string;
      client_name?: string;
      client_id?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deal_clients')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log stage change
      if (previousStage && previousStage !== stage) {
        const labels: Record<string, string> = {
          enviado: 'Enviado', agendar_visita: 'Agendar Visita', visitou: 'Visitou',
          em_negociacao: 'Em Negociação', vendido: 'Vendido',
          nao_interessa: 'Não Interessa', preco_alto: 'Preço Alto', fora_do_perfil: 'Fora do Perfil',
        };
        const description = `${client_name || 'Cliente'}: "${labels[previousStage]}" → "${labels[stage]}"${notes ? ` — ${notes}` : ''}`;
        await supabase.from('deal_interactions').insert({
          deal_id,
          type: 'stage_change',
          description,
          metadata: { deal_client_id: id, from: previousStage, to: stage, notes },
          created_by: user.id,
        });

        // Also log to client interactions
        if (client_id) {
          const { data: dealData } = await supabase.from('deals').select('codigo_imovel, bairro, cidade, valor, metragem, quartos, vagas').eq('id', deal_id).single();
          const parts: string[] = [];
          if (dealData?.codigo_imovel) parts.push(`Cód: ${dealData.codigo_imovel}`);
          if (dealData?.bairro) parts.push(dealData.bairro);
          if (dealData?.cidade) parts.push(dealData.cidade);
          if (dealData?.valor) parts.push(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(dealData.valor)));
          if (dealData?.metragem) parts.push(`${dealData.metragem}m²`);
          if (dealData?.quartos) parts.push(`${dealData.quartos} qts`);
          if (dealData?.vagas) parts.push(`${dealData.vagas} vg`);
          const dealInfo = parts.length > 0 ? parts.join(', ') : 'Sem dados';
          await supabase.from('client_interactions').insert({
            client_id,
            type: 'stage_change' as const,
            notes: `Imóvel (${dealInfo}): "${labels[previousStage]}" → "${labels[stage]}"${notes ? ` — Motivo: ${notes}` : ''}`,
            created_by: user.id,
          });
        }
      }

      return data;
    },
    onSuccess: (_, { deal_id, client_id }) => {
      queryClient.invalidateQueries({ queryKey: ['deal-clients', deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deal-interactions', deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      if (client_id) {
        queryClient.invalidateQueries({ queryKey: ['client-interactions', client_id] });
      }
      toast.success('Estágio atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar estágio: ' + error.message);
    },
  });
}

export function useCreateDealProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { deal_id: string; client_id: string; valor_proposta: number; composicao: any[] }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: proposal, error } = await supabase
        .from('deal_proposals')
        .insert({ ...data, created_by: user.id })
        .select('*, client:clients(id, name)')
        .single();

      if (error) throw error;

      const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.valor_proposta);
      await supabase.from('deal_interactions').insert({
        deal_id: data.deal_id,
        type: 'proposal_added',
        description: `Proposta de ${formatted} adicionada por "${(proposal as any).client?.name}"`,
        metadata: { proposal_id: proposal.id, valor: data.valor_proposta },
        created_by: user.id,
      });

      return proposal;
    },
    onSuccess: (_, { deal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['deal-proposals', deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deal-interactions', deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', deal_id] });
      toast.success('Proposta adicionada!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar proposta: ' + error.message);
    },
  });
}
