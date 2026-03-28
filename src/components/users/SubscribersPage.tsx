import { useState } from 'react';
import { useUsers, UserWithRole, useUpdateSubscriptionStatus } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, Search, CreditCard, Calendar, CheckCircle2, Clock, XCircle, 
  ShieldAlert, MoreHorizontal, Eye, Power, PowerOff, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KiwifyPayloadDialog } from './KiwifyPayloadDialog';

export function SubscribersPage() {
  const { data: roleData } = useUserRole();
  const isMaster = roleData?.isMaster ?? false;
  const { data: users = [], isLoading } = useUsers();
  const updateStatus = useUpdateSubscriptionStatus();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'canceled'>('all');
  const [selectedUserForPayload, setSelectedUserForPayload] = useState<UserWithRole | null>(null);

  // Security check - only Master can see subscribers
  if (!isMaster) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-center p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta página é exclusiva para o Administrador Master do sistema.
        </p>
      </div>
    );
  }

  // Filter only users who went through the subscription flow 
  // or have a subscription status defined
  const subscribers = users.filter((u: any) => 
    u.subscription_status || u.kiwify_order_id
  );

  const filteredSubscribers = subscribers.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex gap-1 w-fit"><CheckCircle2 size={12}/> Ativa</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1 w-fit"><Clock size={12}/> Pendente</Badge>;
      case 'canceled':
      case 'refunded':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex gap-1 w-fit"><XCircle size={12}/> Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="opacity-50 w-fit">{status || 'N/A'}</Badge>;
    }
  };

  const activeCount = subscribers.filter((s:any) => s.subscription_status === 'active').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="text-amber-500" />
            Gestão de Assinantes
          </h1>
          <p className="text-muted-foreground text-sm">
            Painel administrativo para controle de faturamento e acesso.
          </p>
        </div>
        
        <div className="flex gap-4 items-center bg-secondary/30 px-6 py-3 rounded-2xl border border-white/[0.05]">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Total</p>
            <p className="text-2xl font-display font-bold">{subscribers.length}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Ativos</p>
            <p className="text-2xl font-display font-bold text-emerald-500">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/20 border-white/5 rounded-xl h-11"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button 
            variant={statusFilter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('all')}
            className="rounded-full px-4 h-9 whitespace-nowrap"
          >
            Todos
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('active')}
            className="rounded-full px-4 h-9 whitespace-nowrap"
          >
            Ativos
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('pending')}
            className="rounded-full px-4 h-9 whitespace-nowrap"
          >
            Pendentes
          </Button>
          <Button 
            variant={statusFilter === 'canceled' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setStatusFilter('canceled')}
            className="rounded-full px-4 h-9 whitespace-nowrap"
          >
            Cancelados
          </Button>
        </div>
      </div>

      {/* Table View */}
      <div className="card-elevated border border-white/5 overflow-hidden rounded-2xl bg-secondary/10">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[300px] text-[11px] uppercase tracking-wider font-bold">Corretor</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">Data Inscrição</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">Pedido Kiwify</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wider font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-white/5">
                  <TableCell colSpan={5} className="h-16 bg-white/[0.02]" />
                </TableRow>
              ))
            ) : filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-10" />
                    <p>Nenhuma assinatura encontrada.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-white/10 shrink-0">
                        <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xs font-bold">
                          {getInitials(u.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate text-sm">{u.full_name}</span>
                        <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(u.subscription_status)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded-md text-gray-300 border border-white/5">
                      {u.kiwify_order_id || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-[#0F0F0F] border-white/10 p-1.5 rounded-xl shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest px-2 py-1.5">Ações de Gestão</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        <DropdownMenuItem 
                          className="rounded-lg gap-2 cursor-pointer focus:bg-white/5 py-2.5"
                          onClick={() => setSelectedUserForPayload(u)}
                        >
                          <Eye size={14} className="text-blue-400" /> Ver Dados Kiwify
                        </DropdownMenuItem>

                        {u.subscription_status !== 'active' && (
                          <DropdownMenuItem 
                            className="rounded-lg gap-2 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500 py-2.5 text-emerald-500/80"
                            onClick={() => updateStatus.mutate({ userId: u.user_id, status: 'active' })}
                          >
                            <Power size={14} /> Ativar Manualmente
                          </DropdownMenuItem>
                        )}

                        {(u.subscription_status === 'active' || u.subscription_status === 'pending') && (
                          <DropdownMenuItem 
                            className="rounded-lg gap-2 cursor-pointer focus:bg-red-500/10 focus:text-red-500 py-2.5 text-red-400/80"
                            onClick={() => updateStatus.mutate({ userId: u.user_id, status: 'canceled' })}
                          >
                            <PowerOff size={14} /> Suspender Acesso
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUserForPayload && (
        <KiwifyPayloadDialog
          isOpen={!!selectedUserForPayload}
          onClose={() => setSelectedUserForPayload(null)}
          userName={selectedUserForPayload.full_name}
          payload={selectedUserForPayload.kiwify_payload}
        />
      )}
    </div>
  );
}
