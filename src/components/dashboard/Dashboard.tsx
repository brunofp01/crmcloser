import { UserPlus, AlertTriangle, Calendar, Clock, Loader2, ChevronRight, Building2, Link2, Users, ClipboardList, CheckCircle2 } from 'lucide-react';
import { useDashboardStats, UnlinkedMatch } from '@/hooks/useDashboardStats';
import { useTasks, getDeadlineInfo } from '@/hooks/useTasks';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Client, ClientStage, STAGE_LABELS, STAGE_COLORS, STAGES_ORDER } from '@/types/client';
import { cn } from '@/lib/utils';

interface DashboardProps {
  onClientSelect?: (client: Client) => void;
}

const formatCurrency = (value: number | null) => {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

// Funnel stages to display (lead through proposal)
const FUNNEL_STAGES: ClientStage[] = ['lead', 'qualification', 'contact', 'visit', 'negotiation', 'proposal'];

const FUNNEL_COLORS: Record<string, string> = {
  lead: 'from-blue-500 to-blue-600',
  qualification: 'from-indigo-500 to-indigo-600',
  contact: 'from-purple-500 to-purple-600',
  visit: 'from-amber-500 to-amber-600',
  negotiation: 'from-orange-500 to-orange-600',
  proposal: 'from-cyan-500 to-cyan-600',
};

export function Dashboard({ onClientSelect }: DashboardProps) {
  const navigate = useNavigate();
  const { 
    newLeads, 
    clientsWithoutService, 
    upcomingAppointments,
    activeDealsCount,
    dealsWithMatchCount,
    unlinkedMatches,
    totalClients,
    stageCounts,
    isLoading 
  } = useDashboardStats();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();

  // Build a quick lookup from unlinked matches to Client objects
  const getClientFromMatch = (match: UnlinkedMatch): Client | null => {
    return {
      id: match.clientId,
      name: match.clientName,
      phone: match.clientPhone,
      created_at: match.clientCreatedAt,
      stage: 'lead' as any,
      priority: 'medium' as any,
      email: null, source: null, budget: null, preferred_region: null,
      property_type: null, notes: null, assigned_to: null, created_by: '',
      updated_at: match.clientCreatedAt, budget_max: null, budget_min: null,
      bedrooms_min: null, parking_min: null, area_min: null,
      property_types: null, transaction_type: null, needs_leisure: null,
      leisure_features: null, region_flexible: null, urgencia: null,
      finalidade: null, forma_pagamento: null, elevator_preference: null,
      cidades: null, is_investidor: false, portaria_preferencia: null,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 w-full overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Left column: Funnel + Tasks */}
        <div className="space-y-3 md:space-y-6">
          {/* Sales Funnel */}
          <div className="card-elevated p-3 md:p-5">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-display text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
                <span className="truncate">Funil de Vendas</span>
              </h3>
              <span className="text-[10px] md:text-sm font-semibold text-accent bg-accent/10 px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0">{totalClients} clientes</span>
            </div>
            <div className="space-y-2">
              {FUNNEL_STAGES.map((stage) => {
                const count = stageCounts[stage] || 0;
                const maxCount = Math.max(...FUNNEL_STAGES.map(s => stageCounts[s] || 0), 1);
                const widthPercent = Math.max(20, (count / maxCount) * 100);
                return (
                  <button
                    key={stage}
                    onClick={() => navigate(`/clients?stage=${stage}`)}
                    className="w-full group flex items-center gap-2 md:gap-3 text-left transition-all hover:scale-[1.02]"
                  >
                    <div
                      className={cn(
                        'relative flex items-center justify-between px-3 py-2 md:py-2.5 rounded-lg text-white font-medium text-xs md:text-sm bg-gradient-to-r transition-all',
                        FUNNEL_COLORS[stage]
                      )}
                      style={{ width: `${widthPercent}%`, minWidth: 'fit-content' }}
                    >
                      <span className="truncate">{STAGE_LABELS[stage]}</span>
                      <span className="ml-2 font-bold text-sm md:text-base">{count}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tasks Widget - below funnel */}
          <div className="card-elevated p-3 md:p-5">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-display text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
                <span className="truncate">Tarefas Pendentes</span>
              </h3>
              <button onClick={() => navigate('/tasks')} className="text-[10px] md:text-xs text-accent hover:underline flex-shrink-0">
                Ver todas
              </button>
            </div>
            
            {(() => {
              const pendingTasks = tasks.filter(t => t.status === 'pending');
              // Sort: visits first by due date, then all others by due date
              pendingTasks.sort((a, b) => {
                const aIsVisit = a.type === 'visit';
                const bIsVisit = b.type === 'visit';
                if (aIsVisit && !bIsVisit) return -1;
                if (!aIsVisit && bIsVisit) return 1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              });
              const displayTasks = pendingTasks.slice(0, 8);

              if (displayTasks.length === 0) {
                return (
                  <div className="text-center py-6 md:py-8 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs md:text-sm">Nenhuma tarefa pendente</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2 max-h-[250px] md:max-h-[320px] overflow-y-auto">
                  {displayTasks.map(task => {
                    const deadline = getDeadlineInfo(task.due_date, task.status);
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (task.client) {
                            onClientSelect?.({
                              id: task.client.id,
                              name: task.client.name,
                              phone: '',
                              stage: 'lead' as any,
                              priority: 'medium' as any,
                              email: null, source: null, budget: null, preferred_region: null,
                              property_type: null, notes: null, assigned_to: null, created_by: '',
                              created_at: '', updated_at: '', budget_max: null, budget_min: null,
                              bedrooms_min: null, parking_min: null, area_min: null,
                              property_types: null, transaction_type: null, needs_leisure: null,
                              leisure_features: null, region_flexible: null, urgencia: null,
                              finalidade: null, forma_pagamento: null, elevator_preference: null,
                              cidades: null, is_investidor: false, portaria_preferencia: null,
                            });
                          } else {
                            navigate('/tasks');
                          }
                        }}
                        className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm break-words">{task.title}</p>
                          <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                              <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                              {format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}
                            </span>
                            {task.client && (
                              <span className="text-[10px] md:text-xs text-muted-foreground truncate">
                                👤 {task.client.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          'px-1.5 md:px-2 py-0.5 md:py-1 text-[9px] md:text-[10px] rounded-full flex-shrink-0 font-medium',
                          deadline.variant === 'overdue' && 'bg-destructive/10 text-destructive',
                          deadline.variant === 'today' && 'bg-amber-100 text-amber-700',
                          deadline.variant === 'ontime' && 'bg-emerald-100 text-emerald-700',
                        )}>
                          {deadline.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right column: Leads + Sem Atendimento + Matches */}
        <div className="space-y-3 md:space-y-6">
          {/* Leads Aguardando 1° Contato */}
          {newLeads.length > 0 && (
            <div className="card-elevated p-3 md:p-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-display text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                  <UserPlus className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0" />
                  <span className="truncate">Leads Aguardando 1° Contato</span>
                </h3>
                <span className="text-[10px] md:text-sm font-semibold text-accent bg-accent/10 px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0">{newLeads.length} leads</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {newLeads.slice(0, 8).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => onClientSelect?.(client)}
                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs md:text-sm break-words">{client.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{client.phone}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients without service */}
          <div className="card-elevated p-3 md:p-5">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-display text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning flex-shrink-0" />
                <span className="truncate">Sem Atendimento</span>
              </h3>
              <span className={cn(
                'text-[10px] md:text-sm font-semibold px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0',
                clientsWithoutService.length >= 5 ? 'text-destructive bg-destructive/10' : 'text-warning bg-warning/10'
              )}>{clientsWithoutService.length} clientes</span>
            </div>
            
            {clientsWithoutService.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <Clock className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs md:text-sm">Todos em dia!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] md:max-h-[320px] overflow-y-auto">
                {clientsWithoutService.slice(0, 10).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => onClientSelect?.(client)}
                    className="w-full flex items-center justify-between p-2 md:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-xs md:text-sm break-words">{client.name}</span>
                        <span className={cn(
                          'px-1.5 py-0.5 text-[9px] md:text-[10px] rounded-full text-white flex-shrink-0',
                          STAGE_COLORS[client.stage]
                        )}>
                          {STAGE_LABELS[client.stage]}
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
                        {client.lastInteractionDate 
                          ? formatDistanceToNow(client.lastInteractionDate, { locale: ptBR, addSuffix: true })
                          : formatDistanceToNow(new Date(client.created_at), { locale: ptBR, addSuffix: true })
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <span className="text-[10px] md:text-xs font-medium text-destructive bg-destructive/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                        {client.daysSinceLastInteraction}d
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unlinked Matches */}
          {unlinkedMatches.length > 0 && (
            <div className="card-elevated p-3 md:p-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-display text-sm md:text-lg font-semibold text-foreground flex items-center gap-1.5 md:gap-2">
                  <Link2 className="w-4 h-4 md:w-5 md:h-5 text-warning flex-shrink-0" />
                  <span className="truncate">Matches Não Vinculados</span>
                </h3>
                <span className="text-[10px] md:text-sm font-semibold text-warning bg-warning/10 px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0">{unlinkedMatches.length} pendentes</span>
              </div>

              <div className="space-y-2 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {unlinkedMatches.slice(0, 15).map((match) => (
                  <button
                    key={`${match.dealId}-${match.clientId}`}
                    onClick={() => {
                      const client = getClientFromMatch(match);
                      if (client) onClientSelect?.(client);
                    }}
                    className="w-full flex items-center justify-between p-2 md:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {match.dealCodigoImovel && (
                          <span className="font-mono text-[10px] md:text-xs bg-muted px-1.5 py-0.5 rounded font-medium flex-shrink-0">{match.dealCodigoImovel}</span>
                        )}
                        <span className="text-[9px] md:text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {match.matchScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] md:text-xs text-muted-foreground flex-wrap">
                        {match.dealBairro && <span className="truncate">{match.dealBairro}</span>}
                        {match.dealBairro && match.dealCidade && <span>•</span>}
                        {match.dealCidade && <span className="truncate">{match.dealCidade}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] md:text-xs text-muted-foreground">
                        {match.dealMetragem && <span>{match.dealMetragem}m²</span>}
                        {match.dealQuartos && <span>{match.dealQuartos} qts</span>}
                        {match.dealVagas && <span>{match.dealVagas} vg</span>}
                        {match.dealValor && <span className="font-medium text-foreground">{formatCurrency(match.dealValor)}</span>}
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 break-words">
                        👤 {match.clientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <span className={cn(
                        'text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded',
                        match.daysPending >= 7 ? 'text-destructive bg-destructive/10' :
                        match.daysPending >= 3 ? 'text-warning bg-warning/10' :
                        'text-muted-foreground bg-secondary'
                      )}>
                        {match.daysPending}d
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
