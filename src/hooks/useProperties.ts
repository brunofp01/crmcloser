import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Property {
  id: string;
  codigo: string;
  slug: string;
  titulo: string | null;
  descricao: string | null;
  tipo: string | null;
  categoria: string | null;
  valor: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area_util: number | null;
  area_total: number | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  caracteristicas: Record<string, unknown> | null;
  fotos: string[] | null;
  hotsite_url: string | null;
  ativo: boolean | null;
  destaque: boolean | null;
  source: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useProperties(filters?: {
  search?: string;
  tipo?: string;
  bairro?: string;
  minValue?: number;
  maxValue?: number;
  minQuartos?: number;
  source?: string;
}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      let query = supabase
        .from('imoveis')
        .select('*')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,bairro.ilike.%${filters.search}%,cidade.ilike.%${filters.search}%`);
      }

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters?.bairro) {
        query = query.ilike('bairro', `%${filters.bairro}%`);
      }

      if (filters?.minValue) {
        query = query.gte('valor', filters.minValue);
      }

      if (filters?.maxValue) {
        query = query.lte('valor', filters.maxValue);
      }

      if (filters?.minQuartos) {
        query = query.gte('quartos', filters.minQuartos);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        fotos: Array.isArray(item.fotos) ? item.fotos : [],
        caracteristicas: item.caracteristicas as Record<string, unknown> | null,
      })) as Property[];
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        fotos: Array.isArray(data.fotos) ? data.fotos : [],
        caracteristicas: data.caracteristicas as Record<string, unknown> | null,
      } as Property;
    },
    enabled: !!id,
  });
}

export function usePropertyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['property', 'slug', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        fotos: Array.isArray(data.fotos) ? data.fotos : [],
        caracteristicas: data.caracteristicas as Record<string, unknown> | null,
      } as Property;
    },
    enabled: !!slug,
  });
}
