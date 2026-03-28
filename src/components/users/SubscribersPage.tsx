import { useState } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Search, CreditCard, Calendar, CheckCircle2, Clock, xCircle, ShieldAlert 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SubscribersPage() {
  const { data: roleData } = useUserRole();
  const isMaster = roleData?.isMaster ?? false;
  const { data: users = [], isLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredSubscribers = subscribers.filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex gap-1"><CheckCircle2 size={12}/> Ativa</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex gap-1"><CheckCircle2 size={12}/> Pago</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1"><Clock size={12}/> Pendente</Badge>;
      case 'canceled':
      case 'refunded':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex gap-1"><xCircle size={12}/> Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="opacity-50">{status || 'N/A'}</Badge>;
    }
  };

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
            Monitore o status de contratação e pagamentos dos corretores.
          </p>
        </div>
        
        <div className="flex gap-4 items-center bg-secondary/30 px-4 py-2 rounded-lg border border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total</p>
            <p className="text-xl font-bold">{subscribers.length}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Ativos</p>
            <p className="text-xl font-bold text-emerald-500">{subscribers.filter((s:any) => s.subscription_status === 'active').length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Subscribers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-secondary/20 animate-pulse" />
          ))
        ) : filteredSubscribers.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma assinatura encontrada nesta busca.</p>
          </div>
        ) : (
          filteredSubscribers.map((u: any) => (
            <div key={u.id} className="card-elevated p-5 space-y-4 hover:border-amber-500/20 transition-all border border-transparent">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold">
                    {getInitials(u.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground truncate">{u.full_name}</h4>
                  <div className="mt-1">
                    {getStatusBadge(u.subscription_status)}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 uppercase font-medium">
                    <Calendar size={13} /> Inscrito em
                  </span>
                  <span className="text-foreground font-medium">
                    {format(new Date(u.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 uppercase font-medium">
                    <CreditCard size={13} /> Pedido Kiwify
                  </span>
                  <span className="text-foreground font-mono bg-secondary/50 px-1.5 rounded">
                    {u.kiwify_order_id || '---'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Email de Acesso</p>
                <p className="text-sm truncate font-medium text-gray-300">{u.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
