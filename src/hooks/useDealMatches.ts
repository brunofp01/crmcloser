import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo, useState } from 'react';
import { Client } from '@/types/client';
import { DealWithClients } from '@/types/deal';
import { useDeals } from './useDeals';
import { useAuth } from '@/contexts/AuthContext';

export interface MatchedDeal {
  id: string;
  title: string | null;
  valor: number | null;
  bairro: string | null;
  cidade: string | null;
  quartos: number | null;
  vagas: number | null;
  metragem: number | null;
  tipo: string | null;
  listing_image_url: string | null;
  listing_url: string | null;
  comissao_percentual: number | null;
  matchScore: number;
  matchReasons: string[];
  alreadyLinked: boolean;
}

interface UseDealMatchesOptions {
  client: Client;
}

export function useDealMatches({ client }: UseDealMatchesOptions) {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dismissed matches for this client
  const { data: dismissedDealIds = [] } = useQuery({
    queryKey: ['dismissed-matches', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dismissed_matches')
        .select('deal_id')
        .eq('client_id', client.id);
      if (error) throw error;
      return (data || []).map(d => d.deal_id);
    },
    enabled: !!user && !!client.id,
  });

  const matches = useMemo((): MatchedDeal[] => {
    if (!deals.length) return [];

    const activeDeals = deals.filter(d => d.status === 'active');

    return activeDeals.map(deal => {
      let score = 50;
      const reasons: string[] = [];

      // Budget match
      if (deal.valor && client.budget_max) {
        if (deal.valor <= client.budget_max) {
          score += 15;
          reasons.push('Dentro do orçamento');
        } else if (deal.valor <= client.budget_max * 1.1) {
          score += 8;
          reasons.push('Próximo do orçamento');
        } else {
          score -= 15;
        }
      }

      if (deal.valor && client.budget_min) {
        if (deal.valor < client.budget_min) {
          score -= 10;
        }
      }

      // Neighborhood match - HIGH PRIORITY
      if (deal.bairro && client.preferred_region) {
        const dealBairro = deal.bairro.toLowerCase().trim();
        const clientRegions = client.preferred_region.toLowerCase().split(',').map(r => r.trim()).filter(Boolean);
        const matched = clientRegions.some(region => 
          dealBairro.includes(region) || region.includes(dealBairro)
        );
        if (matched) {
          score += 15;
          reasons.push(`Bairro: ${deal.bairro}`);
        } else {
          score -= 10;
        }
      }

      // Bedrooms
      if (deal.quartos && client.bedrooms_min) {
        if (deal.quartos >= client.bedrooms_min) {
          score += 10;
          reasons.push(`${deal.quartos} quartos`);
        } else {
          score -= 10;
        }
      }

      // Parking
      if (deal.vagas && client.parking_min) {
        if (deal.vagas >= client.parking_min) {
          score += 5;
        } else {
          score -= 5;
        }
      }

      // Area
      if (deal.metragem && client.area_min) {
        if (deal.metragem >= client.area_min) {
          score += 10;
          reasons.push(`${deal.metragem}m²`);
        } else if (deal.metragem >= client.area_min * 0.9) {
          score += 5;
        } else {
          score -= 10;
        }
      }

      // Type match
      if (deal.tipo && client.property_types?.length) {
        const dealTipo = deal.tipo.toLowerCase();
        if (client.property_types.some(t => dealTipo.includes(t) || t.includes(dealTipo))) {
          score += 5;
          reasons.push('Tipo compatível');
        }
      }

      // Already linked?
      const alreadyLinked = deal.deal_clients?.some(dc => dc.client_id === client.id) || false;

      return {
        id: deal.id,
        title: deal.title,
        valor: deal.valor,
        bairro: deal.bairro,
        cidade: deal.cidade,
        quartos: deal.quartos,
        vagas: deal.vagas,
        metragem: deal.metragem,
        tipo: deal.tipo,
        listing_image_url: deal.listing_image_url,
        listing_url: deal.listing_url,
        comissao_percentual: deal.comissao_percentual,
        matchScore: Math.max(0, Math.min(100, score)),
        matchReasons: reasons.slice(0, 3),
        alreadyLinked,
      };
    })
    .filter(m => m.matchScore >= 100 && !m.alreadyLinked && !dismissedDealIds.includes(m.id))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 15);
  }, [deals, client, dismissedDealIds]);

  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['deals'] });
    // Small delay to show the animation
    setTimeout(() => setIsRefreshing(false), 800);
  }, [queryClient]);

  return {
    data: matches,
    isLoading: dealsLoading,
    isRefreshing,
    forceRefresh,
  };
}
