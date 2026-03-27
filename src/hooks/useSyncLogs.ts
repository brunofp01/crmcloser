import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface SyncLog {
  id: string;
  sync_type: string;
  status: 'started' | 'success' | 'failed' | 'partial';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  total_items: number;
  inserted: number;
  updated: number;
  deactivated: number;
  errors_count: number;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  feed_hash: string | null;
  xml_size: number | null;
  created_at: string;
}

export function useSyncLogs(limit = 10) {
  const { user } = useAuth();

  // Escutar mudanças em tempo real
  useRealtimeSubscription({
    table: 'imoveis' as const,
    queryKeys: [['sync-logs'], ['properties']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['sync-logs', limit],
    queryFn: async (): Promise<SyncLog[]> => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as SyncLog[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Atualizar a cada 30s
  });
}

export function useLatestSync() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sync-logs', 'latest'],
    queryFn: async (): Promise<SyncLog | null> => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SyncLog | null;
    },
    enabled: !!user,
    refetchInterval: 10000, // Atualizar a cada 10s para mostrar status em tempo real
  });
}

export function useIsSyncing() {
  const { data: latestSync } = useLatestSync();
  
  // Considera sincronizando se o último log foi "started" há menos de 5 minutos
  if (!latestSync) return false;
  
  if (latestSync.status === 'started') {
    const startedAt = new Date(latestSync.started_at);
    const now = new Date();
    const diffMs = now.getTime() - startedAt.getTime();
    return diffMs < 5 * 60 * 1000; // 5 minutos
  }
  
  return false;
}
