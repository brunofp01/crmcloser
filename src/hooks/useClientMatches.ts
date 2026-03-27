import { useState, useMemo, useCallback } from 'react';
import { useClients } from './useClients';
import { Deal, DealWithClients } from '@/types/deal';
import { Client } from '@/types/client';

export interface MatchedClient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  budget_max: number | null;
  bedrooms_min: number | null;
  parking_min: number | null;
  area_min: number | null;
  preferred_region: string | null;
  property_types: string[] | null;
  cidades: string[] | null;
  matchScore: number;
  matchReasons: string[];
  alreadyLinked: boolean;
}

interface UseClientMatchesOptions {
  deal: Deal | DealWithClients;
  linkedClientIds?: string[];
}

export function useClientMatches({ deal, linkedClientIds: externalLinkedIds }: UseClientMatchesOptions) {
  const { data: clients = [] } = useClients();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const linkedClientIds = useMemo(() => {
    if (externalLinkedIds) return new Set(externalLinkedIds);
    const dc = (deal as DealWithClients).deal_clients;
    if (!dc) return new Set<string>();
    return new Set(dc.map(d => d.client_id));
  }, [deal, externalLinkedIds]);

  const matches = useMemo((): MatchedClient[] => {
    // Force re-computation on refreshKey
    void refreshKey;
    if (!clients.length) return [];

    return clients
      .filter(client => !linkedClientIds.has(client.id)) // Exclude already linked
      .filter(client => client.stage !== 'lost') // Exclude lost clients
      .map(client => {
        let score = 50;
        const reasons: string[] = [];

        // NEIGHBORHOOD - HIGHEST PRIORITY (+25 / -30)
        if (deal.bairro) {
          const dealBairro = deal.bairro.toLowerCase().trim();
          let neighborhoodMatched = false;

          // Check preferred_region
          if (client.preferred_region) {
            const clientRegions = client.preferred_region.toLowerCase().split(',').map(r => r.trim()).filter(Boolean);
            neighborhoodMatched = clientRegions.some(region => 
              dealBairro.includes(region) || region.includes(dealBairro)
            );
          }

          // Also check cidades field
          if (!neighborhoodMatched && client.cidades?.length) {
            neighborhoodMatched = client.cidades.some(cidade => 
              dealBairro.includes(cidade.toLowerCase().trim()) || cidade.toLowerCase().trim().includes(dealBairro)
            );
          }

          if (neighborhoodMatched) {
            score += 25;
            reasons.push(`Bairro: ${deal.bairro}`);
          } else {
            score -= 30; // Strong penalty for wrong neighborhood
          }
        }

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

        return {
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          budget_max: client.budget_max,
          bedrooms_min: client.bedrooms_min,
          parking_min: client.parking_min,
          area_min: client.area_min,
          preferred_region: client.preferred_region,
          property_types: client.property_types,
          cidades: client.cidades,
          matchScore: Math.max(0, Math.min(100, score)),
          matchReasons: reasons.slice(0, 3),
          alreadyLinked: false,
        };
      })
      .filter(m => m.matchScore >= 100)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15);
  }, [clients, deal, linkedClientIds, refreshKey]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  return {
    data: matches,
    isLoading: false,
    isRefreshing,
    refresh,
  };
}
