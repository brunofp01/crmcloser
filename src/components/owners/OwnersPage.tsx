import { useState, useMemo, useCallback } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PORTARIA_LABELS, DEAL_CLIENT_STAGES_ORDER, DEAL_CLIENT_STAGE_LABELS, DEAL_CLIENT_STAGE_COLORS, type DealClientStage } from '@/types/deal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { checkDuplicatePhone } from '@/hooks/useCheckDuplicatePhone';
import {
  Search, Loader2, Phone, Mail, MessageCircle,
  MapPin, BedDouble, Car, Maximize2, DollarSign, ShoppingCart,
  Megaphone, FileText, CheckCircle2, ArrowRightLeft, UserPlus,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// --- Owner stage funnel ---
export type OwnerStage = 'anunciado' | 'com_proposta' | 'vendido' | 'transicao_comprador';

export const OWNER_STAGES: OwnerStage[] = ['anunciado', 'com_proposta', 'vendido', 'transicao_comprador'];

export const OWNER_STAGE_LABELS: Record<OwnerStage, string> = {
  anunciado: 'Imóvel Anunciado',
  com_proposta: 'Com Proposta',
  vendido: 'Vendido',
  transicao_comprador: 'Transição p/ Comprador',
};

export const OWNER_STAGE_COLORS: Record<OwnerStage, string> = {
  anunciado: 'bg-blue-500',
  com_proposta: 'bg-amber-500',
  vendido: 'bg-emerald-500',
  transicao_comprador: 'bg-purple-500',
};

export const OWNER_STAGE_TEXT_COLORS: Record<OwnerStage, string> = {
  anunciado: 'text-blue-600',
  com_proposta: 'text-amber-600',
  vendido: 'text-emerald-600',
  transicao_comprador: 'text-purple-600',
};

export const OWNER_STAGE_BG_COLORS: Record<OwnerStage, string> = {
  anunciado: 'bg-blue-500/10',
  com_proposta: 'bg-amber-500/10',
  vendido: 'bg-emerald-500/10',
  transicao_comprador: 'bg-purple-500/10',
};

const OWNER_STAGE_ICONS: Record<OwnerStage, React.ReactNode> = {
  anunciado: <Megaphone className="w-3.5 h-3.5" />,
  com_proposta: <FileText className="w-3.5 h-3.5" />,
  vendido: <CheckCircle2 className="w-3.5 h-3.5" />,
  transicao_comprador: <ArrowRightLeft className="w-3.5 h-3.5" />,
};

export interface OwnerDeal {
  id: string;
  title: string | null;
  valor: number | null;
  bairro: string | null;
  cidade: string | null;
  endereco: string | null;
  metragem: number | null;
  quartos: number | null;
  vagas: number | null;
  status: string;
  portaria: string | null;
  proprietario_quer_comprar: boolean;
  deal_clients_stages: DealClientStage[];
}

export interface Owner {
  name: string;
  whatsapp: string | null;
  email: string | null;
  quer_comprar: boolean;
  deals: OwnerDeal[];
  stage: OwnerStage;
}

function formatCurrency(value: number | null | undefined) {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function openWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleaned}`, '_blank');
}

interface OwnersPageProps {
  onOwnerSelect?: (owner: Owner) => void;
}

export function OwnersPage({ onOwnerSelect }: OwnersPageProps) {
  const { data: deals = [], isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterQuerComprar, setFilterQuerComprar] = useState(false);
  const [creatingClient, setCreatingClient] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Derive stage for each deal
  function getOwnerStage(deal: any): OwnerStage {
    if (deal.proprietario_quer_comprar) return 'transicao_comprador';
    if (deal.status === 'sold') return 'vendido';
    if ((deal.proposals_count ?? 0) > 0) return 'com_proposta';
    return 'anunciado';
  }

  // Group deals by owner (name + whatsapp)
  const owners = useMemo(() => {
    const grouped = new Map<string, Owner>();
    deals
      .filter(deal => !!deal.proprietario_nome)
      .forEach(deal => {
        const querComprar = (deal as any).proprietario_quer_comprar === true;
        const stage = getOwnerStage(deal);
        const key = `${deal.proprietario_nome}__${deal.proprietario_whatsapp ?? ''}`;
        const dealEntry: OwnerDeal = {
          id: deal.id,
          title: deal.title,
          valor: deal.valor,
          bairro: deal.bairro,
          cidade: deal.cidade,
          endereco: deal.endereco,
          metragem: deal.metragem,
          quartos: deal.quartos,
          vagas: deal.vagas,
          status: deal.status,
          portaria: (deal as any).portaria || null,
          proprietario_quer_comprar: querComprar,
          deal_clients_stages: (deal.deal_clients || []).map(dc => dc.stage),
        };
        if (grouped.has(key)) {
          const existing = grouped.get(key)!;
          existing.deals.push(dealEntry);
          if (querComprar) existing.quer_comprar = true;
        } else {
          grouped.set(key, {
            name: deal.proprietario_nome!,
            whatsapp: deal.proprietario_whatsapp ?? null,
            email: deal.proprietario_email ?? null,
            quer_comprar: querComprar,
            stage,
            deals: [dealEntry],
          });
        }
      });
    // Sort by most advanced stage across all deals (descending)
    const getOwnerMaxStageRank = (owner: Owner): number => {
      let maxRank = -1; // -1 = inativo
      for (const deal of owner.deals) {
        const validStages = deal.deal_clients_stages.filter(s =>
          DEAL_CLIENT_STAGES_ORDER.includes(s)
        );
        if (validStages.length > 0) {
          for (const s of validStages) {
            // +2 offset so client stages always rank above ativo(1) and inativo(0)
            const idx = DEAL_CLIENT_STAGES_ORDER.indexOf(s) + 2;
            if (idx > maxRank) maxRank = idx;
          }
        } else {
          // No clients: ativo = 1, inativo = 0
          const rank = deal.status === 'cancelled' ? 0 : 1;
          if (rank > maxRank) maxRank = rank;
        }
      }
      return maxRank;
    };
    return Array.from(grouped.values()).sort((a, b) => {
      const rankDiff = getOwnerMaxStageRank(b) - getOwnerMaxStageRank(a);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });
  }, [deals]);


  // Filter
  const filteredOwners = useMemo(() => {
    let result = owners;
    if (filterQuerComprar) {
      result = result.filter(o => o.quer_comprar);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.name.toLowerCase().includes(q) ||
        (o.email?.toLowerCase().includes(q) ?? false) ||
        (o.whatsapp?.includes(searchQuery) ?? false) ||
        o.deals.some(d =>
          d.bairro?.toLowerCase().includes(q) ||
          d.cidade?.toLowerCase().includes(q) ||
          d.endereco?.toLowerCase().includes(q)
        )
      );
    }
    return result;
  }, [owners, searchQuery, filterQuerComprar]);

  // Toggle quer_comprar
  const toggleQuerComprar = useCallback(async (owner: Owner, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !owner.quer_comprar;
    try {
      const dealIds = owner.deals.map(d => d.id);
      const { error } = await supabase
        .from('deals')
        .update({ proprietario_quer_comprar: newValue } as any)
        .in('id', dealIds);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success(newValue ? 'Proprietário marcado como comprador' : 'Marcação de comprador removida');
    } catch {
      toast.error('Erro ao atualizar');
    }
  }, [queryClient]);

  const createAsClient = useCallback(async (owner: Owner, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !owner.whatsapp) {
      toast.error('Proprietário sem WhatsApp cadastrado');
      return;
    }
    setCreatingClient(owner.whatsapp);
    try {
      const { exists, clientName } = await checkDuplicatePhone(owner.whatsapp);
      if (exists) {
        toast.error(`Já existe um cliente com este telefone: ${clientName}`);
        return;
      }
      const { error } = await supabase.from('clients').insert({
        name: owner.name,
        phone: owner.whatsapp,
        email: owner.email || undefined,
        created_by: user.id,
        source: 'Proprietário',
        notes: `Proprietário do imóvel: ${owner.deals[0]?.title || owner.deals[0]?.endereco || 'N/A'}`,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente criado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao criar cliente: ' + err.message);
    } finally {
      setCreatingClient(null);
    }
  }, [user, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isMobile ? "Buscar..." : "Buscar por nome, email, telefone, bairro..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Filter: Vendendo p/ Comprar */}
      <div
        onClick={() => setFilterQuerComprar(!filterQuerComprar)}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
          filterQuerComprar
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-card border-border hover:border-foreground/20'
        )}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className={cn('w-4 h-4', filterQuerComprar ? 'text-amber-600' : 'text-muted-foreground')} />
          <span className={cn('text-sm font-medium', filterQuerComprar ? 'text-amber-600' : 'text-foreground')}>
            Vendendo p/ Comprar
          </span>
        </div>
        <Switch checked={filterQuerComprar} onCheckedChange={setFilterQuerComprar} />
      </div>


      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredOwners.length} proprietário{filteredOwners.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Cards Grid */}
      {filteredOwners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">Nenhum proprietário encontrado</p>
          <p className="text-sm text-muted-foreground">
            Proprietários são extraídos automaticamente dos imóveis cadastrados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredOwners.map((owner) => {
            return (
              <div
                key={`${owner.name}__${owner.whatsapp ?? ''}`}
                onClick={() => onOwnerSelect?.(owner)}
                className="card-elevated p-4 cursor-pointer hover:shadow-prominent transition-all animate-scale-in space-y-3"
              >
                {/* Name + deals count */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 min-w-0 flex-1">{owner.name}</h4>
                  {owner.deals.length > 1 && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {owner.deals.length} imóveis
                    </Badge>
                  )}
                </div>

                {/* Contact info */}
                {owner.email && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 min-w-0">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{owner.email}</span>
                    </div>
                  </div>
                )}

                {/* Properties list */}
                {owner.deals.map((deal) => (
                  <div key={deal.id} className="p-2 rounded-lg bg-secondary/30 border border-border/50 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 text-xs text-foreground min-w-0 flex-1">
                        <MapPin className="w-3 h-3 shrink-0 text-muted-foreground mt-0.5" />
                        <span className="line-clamp-2 font-medium leading-tight">
                          {deal.endereco
                            ? `${deal.endereco}${deal.bairro ? `, ${deal.bairro}` : ''}`
                            : deal.bairro || 'Endereço não informado'}
                          {deal.cidade && ` - ${deal.cidade}`}
                        </span>
                      </div>
                      {(() => {
                        const validStages = deal.deal_clients_stages.filter(s => 
                          DEAL_CLIENT_STAGES_ORDER.includes(s)
                        );
                        if (validStages.length > 0) {
                          const maxStage = validStages.reduce((best, s) => {
                            const bestIdx = DEAL_CLIENT_STAGES_ORDER.indexOf(best);
                            const sIdx = DEAL_CLIENT_STAGES_ORDER.indexOf(s);
                            return sIdx > bestIdx ? s : best;
                          });
                          const color = DEAL_CLIENT_STAGE_COLORS[maxStage] || 'bg-muted';
                          return (
                            <Badge className={cn('text-[10px] border-0 shrink-0 text-white', color)}>
                              {DEAL_CLIENT_STAGE_LABELS[maxStage]}
                            </Badge>
                          );
                        }
                        return (
                          <Badge className={cn(
                            'text-[10px] border-0 shrink-0',
                            deal.status === 'cancelled' ? 'bg-red-500/15 text-red-600' : 'bg-blue-500/15 text-blue-600'
                          )}>
                            {deal.status === 'cancelled' ? 'Inativo' : 'Ativo'}
                          </Badge>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground flex-wrap">
                      {deal.metragem != null && deal.metragem > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Maximize2 className="w-2.5 h-2.5" />{deal.metragem}m²
                        </span>
                      )}
                      {deal.quartos != null && deal.quartos > 0 && (
                        <span className="flex items-center gap-0.5">
                          <BedDouble className="w-2.5 h-2.5" />{deal.quartos} qts
                        </span>
                      )}
                      {deal.vagas != null && deal.vagas > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Car className="w-2.5 h-2.5" />{deal.vagas} vg
                        </span>
                      )}
                      {deal.portaria && (
                        <span>{PORTARIA_LABELS[deal.portaria] || deal.portaria}</span>
                      )}
                      {deal.valor && (
                        <span className="flex items-center gap-0.5 font-semibold text-accent">
                          <DollarSign className="w-2.5 h-2.5" />{formatCurrency(deal.valor)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    {owner.whatsapp && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(owner.whatsapp!); }}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                    )}
                    <button
                      onClick={(e) => toggleQuerComprar(owner, e)}
                      className={cn(
                        'flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 transition-all',
                        owner.quer_comprar
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25'
                      )}
                      title={owner.quer_comprar ? 'Desmarcar' : 'Marcar como vendendo para comprar'}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {isMobile
                        ? (owner.quer_comprar ? 'Comprador ✓' : 'Comprador')
                        : (owner.quer_comprar ? 'Vendendo p/ Comprar ✓' : 'Vendendo p/ Comprar')}
                    </button>
                    {owner.whatsapp && (
                      <button
                        onClick={(e) => createAsClient(owner, e)}
                        disabled={creatingClient === owner.whatsapp}
                        className={cn(
                          'flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 transition-all disabled:opacity-50',
                          'bg-blue-500/15 text-blue-700 hover:bg-blue-500/25'
                        )}
                        title="Criar como cliente"
                      >
                        {creatingClient === owner.whatsapp
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <UserPlus className="w-3.5 h-3.5" />}
                        {isMobile ? 'Cliente' : 'Criar Cliente'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
