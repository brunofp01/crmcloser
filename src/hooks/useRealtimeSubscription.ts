import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'clients' | 'client_interactions' | 'appointments' | 'imoveis' | 'notifications' | 'profiles' | 'deals' | 'deal_clients' | 'deal_proposals' | 'deal_interactions' | 'dismissed_matches';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  queryKeys: string[][];
  filter?: string;
  enabled?: boolean;
}

/**
 * Hook para escutar mudanças em tempo real no banco de dados
 * e invalidar automaticamente as queries relacionadas
 */
export function useRealtimeSubscription({
  table,
  queryKeys,
  filter,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          console.log(`[Realtime] ${table} change:`, payload.eventType);
          
          // Invalidar todas as queries relacionadas
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${table} subscription:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKeys, filter, enabled, queryClient]);
}

/**
 * Hook para escutar mudanças em múltiplas tabelas
 */
export function useMultiTableRealtime(
  tables: Array<{ table: TableName; queryKeys: string[][] }>,
  enabled = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channels = tables.map(({ table, queryKeys }) => {
      const channelName = `realtime-${table}-${Date.now()}`;
      
      return supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          () => {
            console.log(`[Realtime] ${table} change detected`);
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [tables, enabled, queryClient]);
}
