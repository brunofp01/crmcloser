import { useState } from 'react';
import { useUsers, useCreateUser, useDeleteUser, useSendPasswordReset, useUpdateUserRole, useUpdateUserManager, UserWithRole } from '@/hooks/useUsers';
import { useClients, useUpdateClient } from '@/hooks/useClients';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  UserPlus, Trash2, KeyRound, Loader2, Users, Phone, Mail, Search, Shield, UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['gerente', 'corretor']).default('corretor'),
  manager_id: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const ROLE_LABELS: Record<AppRole, string> = {
  master: 'Master',
  gerente: 'Gerente',
  corretor: 'Corretor',
};

const ROLE_COLORS: Record<AppRole, string> = {
  master: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  gerente: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  corretor: 'bg-secondary text-muted-foreground border-border',
};

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { data: roleData } = useUserRole();
  const isMaster = roleData?.isMaster ?? false;
  const isGerente = roleData?.isGerente ?? false;
  const currentRole = roleData?.role ?? 'corretor';

  const { data: users = [], isLoading } = useUsers();
  const { data: clients = [] } = useClients();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const sendPasswordReset = useSendPasswordReset();
  const updateClient = useUpdateClient();
  const updateRole = useUpdateUserRole();
  const updateManager = useUpdateUserManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [assignClientDialog, setAssignClientDialog] = useState<{ userId: string; userName: string } | null>(null);

  // Corretor cannot access this page
  if (!isMaster && !isGerente) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta página é exclusiva para administradores e gerentes.
        </p>
      </div>
    );
  }

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: '', email: '', whatsapp: '', password: '', role: 'corretor', manager_id: '' },
  });

  const selectedRole = form.watch('role');

  // Filter users based on viewer role
  const visibleUsers = users.filter((u) => {
    if (u.user_id === currentUser?.id) return false; // hide self
    if (isMaster) return true; // master sees all
    // Gerente sees only their team members
    if (isGerente) return u.manager_id === currentUser?.id;
    return false;
  });

  const filteredUsers = visibleUsers.filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const gerentes = users.filter(u => u.app_role === 'gerente');

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const handleCreateUser = async (data: UserFormData) => {
    await createUser.mutateAsync({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      whatsapp: data.whatsapp,
      role: isGerente ? 'corretor' : (data.role as AppRole),
      manager_id: isGerente ? currentUser?.id : (data.manager_id || null),
    });
    form.reset();
    setShowNewUserDialog(false);
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser.mutateAsync(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    await sendPasswordReset.mutateAsync(email);
  };

  const handleAssignClient = async (clientId: string, userId: string) => {
    await updateClient.mutateAsync({ id: clientId, assigned_to: userId });
    toast.success('Cliente atribuído com sucesso!');
  };

  const handleRoleChange = (userId: string, role: AppRole) => {
    updateRole.mutate({ userId, role });
    if (role === 'gerente') {
      updateManager.mutate({ userId, managerId: null });
    }
  };

  const handleManagerChange = (userId: string, managerId: string) => {
    updateManager.mutate({ userId, managerId: managerId === 'none' ? null : managerId });
  };

  const userClients = (userId: string) =>
    clients.filter((c) => c.assigned_to === userId || c.created_by === userId);

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return null;
    return users.find(u => u.user_id === managerId)?.full_name || null;
  };

  const getTeamMembers = (gerenteUserId: string) =>
    users.filter(u => u.manager_id === gerenteUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            {isGerente ? 'Minha Equipe' : 'Gestão de Usuários'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isGerente ? 'Gerencie os corretores da sua equipe' : 'Gerencie usuários, cargos e equipes'}
          </p>
        </div>

        <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-gold text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              {isGerente ? 'Novo Corretor' : 'Novo Usuário'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isGerente ? 'Cadastrar Novo Corretor' : 'Cadastrar Novo Usuário'}</DialogTitle>
              <DialogDescription>Preencha os dados do novo usuário</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome Completo *</label>
                <Input {...form.register('full_name')} placeholder="Nome completo" />
                {form.formState.errors.full_name && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input {...form.register('email')} type="email" placeholder="email@exemplo.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">WhatsApp</label>
                <Input {...form.register('whatsapp')} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="text-sm font-medium">Senha *</label>
                <Input {...form.register('password')} type="password" placeholder="Mínimo 6 caracteres" />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Role selection - only for master */}
              {isMaster && (
                <div>
                  <label className="text-sm font-medium">Cargo *</label>
                  <Select
                    value={selectedRole}
                    onValueChange={(v) => form.setValue('role', v as 'gerente' | 'corretor')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="corretor">Corretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Manager selection - only for master creating corretor */}
              {isMaster && selectedRole === 'corretor' && (
                <div>
                  <label className="text-sm font-medium">Gerente (opcional)</label>
                  <Select
                    value={form.watch('manager_id') || 'none'}
                    onValueChange={(v) => form.setValue('manager_id', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem gerente</SelectItem>
                      {gerentes.map(g => (
                        <SelectItem key={g.user_id} value={g.user_id}>{g.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewUserDialog(false)}>Cancelar</Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const role = u.app_role || 'corretor';
            const managerName = getManagerName(u.manager_id);
            const teamMembers = role === 'gerente' ? getTeamMembers(u.user_id) : [];

            return (
              <div key={u.id} className="card-elevated p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{u.full_name}</h4>
                    <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{u.email || 'Sem email'}</span>
                  </div>
                  {u.whatsapp && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{u.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{userClients(u.user_id).length} clientes</span>
                  </div>
                  {managerName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserCog className="w-4 h-4" />
                      <span>Gerente: {managerName}</span>
                    </div>
                  )}
                  {role === 'gerente' && teamMembers.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Equipe: {teamMembers.length} membro{teamMembers.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Role & Manager Controls - only for master */}
                {isMaster && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-14 shrink-0">Cargo:</span>
                      <Select value={role} onValueChange={(v) => handleRoleChange(u.user_id, v as AppRole)}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gerente" className="text-xs">Gerente</SelectItem>
                          <SelectItem value="corretor" className="text-xs">Corretor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {role === 'corretor' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-14 shrink-0">Gerente:</span>
                        <Select
                          value={u.manager_id || 'none'}
                          onValueChange={(v) => handleManagerChange(u.user_id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Sem gerente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs">Sem gerente</SelectItem>
                            {gerentes.map(g => (
                              <SelectItem key={g.user_id} value={g.user_id} className="text-xs">
                                {g.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignClientDialog({ userId: u.user_id, userName: u.full_name })}
                    className="flex-1"
                  >
                    Atribuir Cliente
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (u.email) handleSendPasswordReset(u.email);
                      else toast.info('Email do usuário não encontrado.');
                    }}
                    title="Recuperar Senha"
                  >
                    <KeyRound className="w-4 h-4" />
                  </Button>
                  {isMaster && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUserToDelete(u.user_id)}
                      className="text-destructive hover:text-destructive"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Client Dialog */}
      <Dialog open={!!assignClientDialog} onOpenChange={() => setAssignClientDialog(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuir Cliente para {assignClientDialog?.userName}</DialogTitle>
            <DialogDescription>Selecione um cliente para atribuir a este usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {clients.filter((c) => c.assigned_to !== assignClientDialog?.userId).map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  if (assignClientDialog) {
                    handleAssignClient(client.id, assignClientDialog.userId);
                    setAssignClientDialog(null);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
