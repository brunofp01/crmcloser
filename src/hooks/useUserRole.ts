import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'master' | 'gerente' | 'corretor';

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<{ isMaster: boolean; isGerente: boolean; role: AppRole }> => {
      if (!user) return { isMaster: false, isGerente: false, role: 'corretor' };

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        // Fallback to email check for master
        const isMaster = user.email === 'brunofp01@gmail.com';
        return { isMaster, isGerente: false, role: isMaster ? 'master' : 'corretor' };
      }

      const role = data.role as AppRole;
      return {
        isMaster: role === 'master',
        isGerente: role === 'gerente',
        role,
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
