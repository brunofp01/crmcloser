import { useState, useMemo } from 'react';
import { STAGE_LABELS, PRIORITY_LABELS, ClientStage, ClientPriority } from '@/types/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientsWithBroker, ClientWithBroker } from '@/hooks/useClientsWithBroker';
import {
  Search, ChevronDown, Grid3X3, List, Loader2, Filter, UserCheck, ArrowUpDown,
} from 'lucide-react';

type SortOption = 'recent' | 'updated';

interface ClientListProps {
  onClientSelect: (client: ClientWithBroker) => void;
}

export function ClientList({ onClientSelect }: ClientListProps) {
  const { data: clients = [], isLoading } = useClientsWithBroker();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [stageFilter, setStageFilter] = useState<ClientStage | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ClientPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  const filteredClients = useMemo(() => {
    let result = clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        client.phone.includes(searchQuery);
      const matchesStage = stageFilter === 'all' || client.stage === stageFilter;
      const matchesPriority = priorityFilter === 'all' || client.priority === priorityFilter;
      return matchesSearch && matchesStage && matchesPriority;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [clients, searchQuery, stageFilter, priorityFilter, sortBy]);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isMobile ? "Buscar..." : "Buscar por nome, email ou telefone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "md:hidden p-2.5 rounded-lg border border-border",
              showFilters && "bg-accent/10 border-accent"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as ClientStage | 'all')}
                className="appearance-none px-4 py-2 pr-8 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer">
                <option value="all">Todos os estágios</option>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ClientPriority | 'all')}
                className="appearance-none px-4 py-2 pr-8 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer">
                <option value="all">Todas as prioridades</option>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {/* Sort */}
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none px-4 py-2 pr-8 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer">
                <option value="recent">Mais recente</option>
                <option value="updated">Última interação</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* View Mode */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-secondary rounded-lg">
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-card shadow-sm' : 'hover:bg-card/50')}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-card shadow-sm' : 'hover:bg-card/50')}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="md:hidden flex gap-2 animate-fade-in flex-wrap">
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as ClientStage | 'all')}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="all">Estágio</option>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ClientPriority | 'all')}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="all">Prioridade</option>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="recent">Mais recente</option>
              <option value="updated">Última interação</option>
            </select>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
      </p>

      {/* Content */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">Nenhum cliente encontrado</p>
          <p className="text-sm text-muted-foreground">Cadastre seu primeiro cliente clicando em "Novo Cliente"</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <div key={client.id} onClick={() => onClientSelect(client)} className="card-elevated p-4 cursor-pointer active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-border flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground break-words">
                    {client.name}
                    {client.is_investidor && (
                      <Badge className="ml-2 bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] align-middle">Investidor</Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                  {client.broker && (
                    <p className="text-xs text-accent flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3 h-3" />{client.broker.full_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full',
                    client.stage === 'lead' && 'bg-blue-100 text-blue-700',
                    client.stage === 'contact' && 'bg-purple-100 text-purple-700',
                    client.stage === 'visit' && 'bg-amber-100 text-amber-700',
                    client.stage === 'proposal' && 'bg-cyan-100 text-cyan-700',
                    client.stage === 'negotiation' && 'bg-orange-100 text-orange-700',
                    client.stage === 'closed' && 'bg-emerald-100 text-emerald-700',
                    client.stage === 'quarantine' && 'bg-gray-100 text-gray-700',
                    client.stage === 'lost' && 'bg-red-100 text-red-700',
                  )}>{STAGE_LABELS[client.stage]}</span>
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full',
                    client.priority === 'high' && 'bg-destructive/10 text-destructive',
                    client.priority === 'medium' && 'bg-warning/10 text-warning',
                    client.priority === 'low' && 'bg-muted text-muted-foreground',
                  )}>{PRIORITY_LABELS[client.priority]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="card-elevated overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Corretor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estágio</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridade</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Orçamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map((client) => (
                <tr key={client.id} onClick={() => onClientSelect(client)} className="hover:bg-secondary/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {client.name}
                          {client.is_investidor && (
                            <Badge className="ml-2 bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] align-middle">Investidor</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{client.source || 'Sem origem'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="text-foreground">{client.phone}</p>
                      <p className="text-muted-foreground text-xs">{client.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {client.broker ? (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <UserCheck className="w-4 h-4 text-accent" />
                        <span className="break-words">{client.broker.full_name}</span>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2.5 py-1 text-xs font-medium rounded-full',
                      client.stage === 'lead' && 'bg-blue-100 text-blue-700',
                      client.stage === 'contact' && 'bg-purple-100 text-purple-700',
                      client.stage === 'visit' && 'bg-amber-100 text-amber-700',
                      client.stage === 'proposal' && 'bg-cyan-100 text-cyan-700',
                      client.stage === 'negotiation' && 'bg-orange-100 text-orange-700',
                      client.stage === 'closed' && 'bg-emerald-100 text-emerald-700',
                      client.stage === 'quarantine' && 'bg-gray-100 text-gray-700',
                      client.stage === 'lost' && 'bg-red-100 text-red-700',
                    )}>{STAGE_LABELS[client.stage]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2.5 py-1 text-xs font-medium rounded-full',
                      client.priority === 'high' && 'bg-destructive/10 text-destructive',
                      client.priority === 'medium' && 'bg-warning/10 text-warning',
                      client.priority === 'low' && 'bg-muted text-muted-foreground',
                    )}>{PRIORITY_LABELS[client.priority]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {client.budget_max
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.budget_max)
                      : client.budget || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} onClick={() => onClientSelect(client)} className="card-elevated p-4 cursor-pointer hover:shadow-prominent transition-all animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground break-words">
                    {client.name}
                    {client.is_investidor && (
                      <Badge className="ml-2 bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] align-middle">Investidor</Badge>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground">{client.source || 'Sem origem'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-muted-foreground">{client.phone}</p>
                {client.broker && (
                  <p className="text-xs text-accent flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />{client.broker.full_name}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full',
                  client.stage === 'lead' && 'bg-blue-100 text-blue-700',
                  client.stage === 'contact' && 'bg-purple-100 text-purple-700',
                  client.stage === 'visit' && 'bg-amber-100 text-amber-700',
                  client.stage === 'proposal' && 'bg-cyan-100 text-cyan-700',
                  client.stage === 'negotiation' && 'bg-orange-100 text-orange-700',
                  client.stage === 'closed' && 'bg-emerald-100 text-emerald-700',
                  client.stage === 'quarantine' && 'bg-gray-100 text-gray-700',
                  client.stage === 'lost' && 'bg-red-100 text-red-700',
                )}>{STAGE_LABELS[client.stage]}</span>
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full',
                  client.priority === 'high' && 'bg-destructive/10 text-destructive',
                  client.priority === 'medium' && 'bg-warning/10 text-warning',
                  client.priority === 'low' && 'bg-muted text-muted-foreground',
                )}>{PRIORITY_LABELS[client.priority]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
