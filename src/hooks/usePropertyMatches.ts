import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';
import { Client, ClientInteraction } from '@/types/client';

export interface FilterCriteria {
  budgetOk: boolean;
  bedroomsOk: boolean;
  parkingOk: boolean;
  areaOk: boolean;
  regionOk: boolean;
  typeOk: boolean;
}

export interface MatchedProperty {
  id: string;
  codigo: string;
  slug: string;
  titulo: string | null;
  tipo: string | null;
  categoria: string | null;
  valor: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area_util: number | null;
  bairro: string | null;
  cidade: string | null;
  fotos: string[] | null;
  caracteristicas: string[] | null;
  matchScore: number;
  matchReasons: string[];
  aiAnalysis?: string;
  alreadySent: boolean;
  filterCriteria?: FilterCriteria;
}

interface UsePropertyMatchesOptions {
  client: Client;
  interactions: ClientInteraction[];
}

interface AIMatchResponse {
  matches: Array<{
    id: string;
    codigo: string;
    slug: string;
    titulo: string | null;
    tipo: string | null;
    categoria: string | null;
    valor: number | null;
    quartos: number | null;
    suites: number | null;
    banheiros: number | null;
    vagas: number | null;
    area_util: number | null;
    bairro: string | null;
    cidade: string | null;
    fotos: string[] | null;
    caracteristicas: string[] | null;
    matchScore: number;
    matchReasons: string[];
    aiAnalysis?: string;
  }>;
  error?: string;
}

export function usePropertyMatches({ client, interactions }: UsePropertyMatchesOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['property-matches', client.id];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Omit<MatchedProperty, 'alreadySent'>[]> => {
      // Call AI match edge function
      const { data, error } = await supabase.functions.invoke<AIMatchResponse>('ai-match', {
        body: {
          client: {
            id: client.id,
            name: client.name,
            budget_max: client.budget_max,
            bedrooms_min: client.bedrooms_min,
            parking_min: client.parking_min,
            area_min: client.area_min,
            property_types: client.property_types,
            preferred_region: client.preferred_region,
            transaction_type: client.transaction_type,
            needs_leisure: client.needs_leisure,
            leisure_features: client.leisure_features,
            notes: client.notes,
            budget: client.budget,
            region_flexible: client.region_flexible,
          },
        },
      });

      if (error) {
        console.error('AI Match error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('AI Match returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.matches) {
        return [];
      }

      return data.matches;
    },
    enabled: !!client.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Compute sent slugs from interactions (always current, not cached)
  const sentSlugs = useMemo(() => {
    const slugs = new Set<string>();
    interactions.forEach(interaction => {
      if (interaction.notes) {
        // Look for property links in notes
        const slugMatches = interaction.notes.match(/\/imovel\/([a-z0-9-]+)/gi);
        if (slugMatches) {
          slugMatches.forEach(match => {
            const slug = match.replace('/imovel/', '');
            slugs.add(slug.toLowerCase());
          });
        }
      }
    });
    return slugs;
  }, [interactions]);

  // Enrich matches with alreadySent flag (computed fresh each render)
  const enrichedData = useMemo((): MatchedProperty[] | undefined => {
    if (!query.data) return undefined;
    
    const enriched = query.data.map(match => ({
      ...match,
      alreadySent: sentSlugs.has(match.slug.toLowerCase()),
    }));

    // Sort: not sent first, then by score descending
    return enriched
      .sort((a, b) => {
        if (a.alreadySent !== b.alreadySent) {
          return a.alreadySent ? 1 : -1;
        }
        return b.matchScore - a.matchScore;
      })
      .slice(0, 15);
  }, [query.data, sentSlugs]);

  // Force refresh that invalidates cache and refetches
  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    ...query,
    data: enrichedData,
    forceRefresh,
  };
}