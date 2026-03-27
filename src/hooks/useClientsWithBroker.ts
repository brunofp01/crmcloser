import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, Profile } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface ClientWithBroker extends Client {
  broker?: Profile | null;
}

export function useClientsWithBroker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Escutar mudanças em tempo real na tabela clients
  useRealtimeSubscription({
    table: 'clients',
    queryKeys: [['clients-with-broker'], ['clients']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['clients-with-broker'],
    queryFn: async (): Promise<ClientWithBroker[]> => {
      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch all profiles to map brokers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Map broker info to clients
      const clientsWithBroker: ClientWithBroker[] = (clients || []).map((client) => {
        const broker = profiles?.find((p) => p.user_id === client.assigned_to) || null;
        return {
          ...client,
          broker,
        } as ClientWithBroker;
      });

      return clientsWithBroker;
    },
    enabled: !!user,
  });
}

export function useClientWithBroker(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-with-broker', id],
    queryFn: async (): Promise<ClientWithBroker | null> => {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!client) return null;

      // Fetch broker profile if assigned
      let broker: Profile | null = null;
      if (client.assigned_to) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', client.assigned_to)
          .maybeSingle();
        broker = profile as Profile | null;
      }

      return {
        ...client,
        broker,
      } as ClientWithBroker;
    },
    enabled: !!user && !!id,
  });
}
