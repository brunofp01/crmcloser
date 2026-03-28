import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'master' | 'gerente' | 'corretor';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<{ isMaster: boolean; isGerente: boolean; role: AppRole; subscriptionStatus: string }> => {
      if (!user) return { isMaster: false, isGerente: false, role: 'corretor', subscriptionStatus: 'none' };

      const [{ data: roleData }, { data: profile }] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const subscriptionStatus = profile?.subscription_status || 'pending';

      if (!roleData) {
        // Fallback to email check for master
        const isMaster = user.email === 'brunofp01@gmail.com';
        return { 
          isMaster, 
          isGerente: false, 
          role: isMaster ? 'master' : 'corretor',
          subscriptionStatus
        };
      }

      const role = roleData.role as AppRole;
      return {
        isMaster: role === 'master',
        isGerente: role === 'gerente',
        role,
        subscriptionStatus
      };
    },
    enabled: !!user,
  });
}

export function useIsMaster() {
  const { data } = useUserRole();
  return data?.isMaster ?? false;
}

export function useIsGerente() {
  const { data } = useUserRole();
  return data?.isGerente ?? false;
}
