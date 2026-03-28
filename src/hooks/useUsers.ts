import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/types/client';
import { toast } from 'sonner';
import { AppRole } from './useUserRole';

export interface UserWithRole extends Profile {
  app_role?: AppRole;
}

export function useUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, AppRole>();
      (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role as AppRole));

      return (profiles || []).map((p: any) => ({
        ...p,
        app_role: roleMap.get(p.user_id) || 'corretor',
      })) as UserWithRole[];
    },
    enabled: !!user,
  });
}

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  whatsapp?: string;
  role?: AppRole;
  manager_id?: string | null;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { data: result, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          whatsapp: data.whatsapp,
          role: data.role || 'corretor',
          manager_id: data.manager_id || null,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir usuário: ' + error.message);
    },
  });
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email de recuperação enviado!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar email: ' + error.message);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast.success('Cargo atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cargo: ' + error.message);
    },
  });
}

export function useUpdateUserManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, managerId }: { userId: string; managerId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: managerId } as any)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Gerente atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar gerente: ' + error.message);
    },
  });
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: Profile['subscription_status'] }) => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_status: status } as any)
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // If activating, ensure the role is set to 'corretor'
      if (status === 'active') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'corretor' }, { onConflict: 'user_id' });
        
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status de assinatura atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar assinatura: ' + error.message);
    },
  });
}
