import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, Appointment } from '@/types/client';
import { subDays, addDays } from 'date-fns';
import { useMemo } from 'react';
import { useDeals } from './useDeals';
import { useMultiTableRealtime } from './useRealtimeSubscription';

interface ClientWithLastInteraction extends Client {
  lastInteractionDate: Date | null;
  daysSinceLastInteraction: number | null;
}

export interface UnlinkedMatch {
  dealId: string;
  dealTitle: string | null;
  dealBairro: string | null;
  dealCidade: string | null;
  dealValor: number | null;
  dealMetragem: number | null;
  dealQuartos: number | null;
  dealVagas: number | null;
  dealCodigoImovel: string | null;
  dealCreatedAt: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientCreatedAt: string;
  clientStage: string;
  matchScore: number;
  daysPending: number;
}

interface DashboardStats {
  totalClients: number;
  newLeads: Client[];
  clientsWithoutService: ClientWithLastInteraction[];
  upcomingAppointments: (Appointment & { client?: Client })[];
  activeDealsCount: number;
  dealsWithMatchCount: number;
  unlinkedMatches: UnlinkedMatch[];
  stageCounts: Record<string, number>;
  isLoading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { user } = useAuth();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();

  // Realtime subscriptions for dashboard auto-refresh
  useMultiTableRealtime(
    [
      { table: 'clients', queryKeys: [['clients']] },
      { table: 'client_interactions', queryKeys: [['all-interactions']] },
      { table: 'appointments', queryKeys: [['upcoming-appointments']] },
      { table: 'deals', queryKeys: [['deals']] },
      { table: 'deal_clients', queryKeys: [['deals']] },
      { table: 'dismissed_matches', queryKeys: [['dismissed-matches-all']] },
    ],
    !!user
  );

  // Fetch dismissed matches to exclude from unlinked matches
  const { data: dismissedMatches = [] } = useQuery({
    queryKey: ['dismissed-matches-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dismissed_matches')
        .select('deal_id, client_id');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
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

  // Fetch all interactions to find last interaction per client
  const { data: interactions = [], isLoading: interactionsLoading } = useQuery({
    queryKey: ['all-interactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_interactions')
        .select('client_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch upcoming appointments (next 7 days)
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: async () => {
      const now = new Date();
      const weekFromNow = addDays(now, 7);

      const { data, error } = await supabase
        .from('appointments')
        .select('*, client:clients(*)')
        .gte('start_time', now.toISOString())
        .lte('start_time', weekFromNow.toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data as (Appointment & { client?: Client })[];
    },
    enabled: !!user,
  });

  // Calculate new leads (clients with stage 'lead' and no interactions)
  const clientIdsWithInteractions = new Set(interactions.map(i => i.client_id));
  const newLeads = clients.filter(
    c => c.stage === 'lead' && !clientIdsWithInteractions.has(c.id)
  );

  // Calculate clients without service for 3+ days
  const lastInteractionMap = new Map<string, Date>();
  interactions.forEach(i => {
    const existing = lastInteractionMap.get(i.client_id);
    const interactionDate = new Date(i.created_at);
    if (!existing || interactionDate > existing) {
      lastInteractionMap.set(i.client_id, interactionDate);
    }
  });

  const clientsWithoutService: ClientWithLastInteraction[] = clients
    .filter(c => c.stage !== 'closed' && c.stage !== 'lost')
    .map(c => {
      const lastInteraction = lastInteractionMap.get(c.id);
      const daysSince = lastInteraction 
        ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...c,
        lastInteractionDate: lastInteraction || null,
        daysSinceLastInteraction: daysSince,
      };
    })
    .filter(c => (c.daysSinceLastInteraction ?? 0) >= 3)
    .sort((a, b) => (b.daysSinceLastInteraction ?? 0) - (a.daysSinceLastInteraction ?? 0));

  // Property/deal stats and unlinked matches
  const activeDeals = useMemo(() => deals.filter(d => d.status === 'active'), [deals]);

  const dismissedSet = useMemo(() => {
    const set = new Set<string>();
    dismissedMatches.forEach(d => set.add(`${d.deal_id}:${d.client_id}`));
    return set;
  }, [dismissedMatches]);

  const { dealsWithMatchCount, unlinkedMatches } = useMemo(() => {
    if (!activeDeals.length || !clients.length) return { dealsWithMatchCount: 0, unlinkedMatches: [] };

    const allUnlinked: UnlinkedMatch[] = [];
    let withMatch = 0;

    for (const deal of activeDeals) {
      let dealHasMatch = false;
      const linkedIds = new Set(deal.deal_clients?.map(dc => dc.client_id) || []);

      for (const client of clients) {
        // Skip clients in 'lost' stage
        if (client.stage === 'lost') continue;

        let score = 50;

        // Budget
        if (deal.valor && client.budget_max) {
          if (deal.valor <= client.budget_max) score += 15;
          else if (deal.valor <= client.budget_max * 1.1) score += 8;
          else score -= 15;
        }
        if (deal.valor && client.budget_min && deal.valor < client.budget_min) score -= 10;

        // Bedrooms
        if (deal.quartos && client.bedrooms_min) {
          score += deal.quartos >= client.bedrooms_min ? 10 : -10;
        }

        // Parking
        if (deal.vagas && client.parking_min) {
          score += deal.vagas >= client.parking_min ? 5 : -5;
        }

        // Area
        if (deal.metragem && client.area_min) {
          if (deal.metragem >= client.area_min) score += 10;
          else if (deal.metragem >= client.area_min * 0.9) score += 5;
          else score -= 10;
        }

        // Region - HIGH PRIORITY
        if (deal.bairro && client.preferred_region) {
          const dealBairro = deal.bairro.toLowerCase().trim();
          const clientRegions = client.preferred_region.toLowerCase().split(',').map(r => r.trim()).filter(Boolean);
          if (clientRegions.some(region => dealBairro.includes(region) || region.includes(dealBairro))) score += 15;
          else score -= 10;
        }

        // Type
        if (deal.tipo && client.property_types?.length) {
          const dt = deal.tipo.toLowerCase();
          if (client.property_types.some(t => dt.includes(t) || t.includes(dt))) score += 5;
        }

        const finalScore = Math.max(0, Math.min(100, score));

        if (finalScore >= 100) {
          dealHasMatch = true;

          if (!linkedIds.has(client.id) && !dismissedSet.has(`${deal.id}:${client.id}`)) {
            // Days pending = since the later of client or deal creation
            const dealDate = new Date(deal.created_at).getTime();
            const clientDate = new Date(client.created_at).getTime();
            const laterDate = Math.max(dealDate, clientDate);
            const daysPending = Math.floor((Date.now() - laterDate) / (1000 * 60 * 60 * 24));

            allUnlinked.push({
              dealId: deal.id,
              dealTitle: deal.title,
              dealBairro: deal.bairro,
              dealCidade: deal.cidade,
              dealValor: deal.valor,
              dealMetragem: deal.metragem,
              dealQuartos: deal.quartos,
              dealVagas: deal.vagas,
              dealCodigoImovel: deal.codigo_imovel,
              dealCreatedAt: deal.created_at,
              clientId: client.id,
              clientName: client.name,
              clientPhone: client.phone,
              clientCreatedAt: client.created_at,
              clientStage: client.stage,
              matchScore: finalScore,
              daysPending,
            });
          }
        }
      }

      if (dealHasMatch) withMatch++;
    }

    allUnlinked.sort((a, b) => b.daysPending - a.daysPending);

    return { dealsWithMatchCount: withMatch, unlinkedMatches: allUnlinked };
  }, [activeDeals, clients, dismissedSet]);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => { counts[c.stage] = (counts[c.stage] || 0) + 1; });
    return counts;
  }, [clients]);

  return {
    totalClients: clients.length,
    newLeads,
    clientsWithoutService,
    upcomingAppointments: appointments,
    activeDealsCount: activeDeals.length,
    dealsWithMatchCount,
    unlinkedMatches,
    stageCounts,
    isLoading: clientsLoading || interactionsLoading || appointmentsLoading || dealsLoading,
  };
}
