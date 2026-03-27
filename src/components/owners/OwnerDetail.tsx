import { Owner, OwnerDeal, OwnerStage, OWNER_STAGE_LABELS, OWNER_STAGE_BG_COLORS, OWNER_STAGE_TEXT_COLORS } from './OwnersPage';
import { PORTARIA_LABELS, DEAL_STATUS_LABELS, DealStatus, DEAL_CLIENT_STAGE_LABELS, DealClientStage, DEAL_CLIENT_STAGE_COLORS } from '@/types/deal';
import { useDeals } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { checkDuplicatePhone } from '@/hooks/useCheckDuplicatePhone';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import {
  X, Phone, Mail, MessageCircle, MapPin, BedDouble, Car,
  Maximize2, DollarSign, ShoppingCart, Building2, User,
  ExternalLink, Bath, DoorOpen, ChefHat, Dumbbell, ArrowUp,
  Megaphone, FileText, CheckCircle2, ArrowRightLeft, Link2,
  UserPlus, Loader2,
} from 'lucide-react';

function formatCurrency(value: number | null | undefined) {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function openWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleaned}`, '_blank');
}

interface OwnerDetailProps {
  owner: Owner;
  onClose: () => void;
}

export function OwnerDetail({ owner, onClose }: OwnerDetailProps) {
  const { data: deals = [] } = useDeals();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [creatingClient, setCreatingClient] = useState(false);

  // Find ALL deals for this owner (by name + whatsapp match)
  const ownerDeals = useMemo(() => {
    return deals.filter(d => {
      if (!d.proprietario_nome) return false;
      if (owner.whatsapp && d.proprietario_whatsapp) {
        return d.proprietario_whatsapp.replace(/\D/g, '') === owner.whatsapp.replace(/\D/g, '');
      }
      return d.proprietario_nome.toLowerCase().trim() === owner.name.toLowerCase().trim();
    });
  }, [deals, owner]);

  const totalValue = useMemo(() => ownerDeals.reduce((sum, d) => sum + (d.valor || 0), 0), [ownerDeals]);

  const toggleQuerComprar = useCallback(async () => {
    const newValue = !owner.quer_comprar;
    try {
      const dealIds = ownerDeals.map(d => d.id);
      const { error } = await supabase
        .from('deals')
        .update({ proprietario_quer_comprar: newValue } as any)
        .in('id', dealIds);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success(newValue ? 'Proprietário marcado como comprador' : 'Marcação removida');
    } catch {
      toast.error('Erro ao atualizar');
    }
  }, [owner, ownerDeals, queryClient]);

  const createAsClient = useCallback(async () => {
    if (!user || !owner.whatsapp) {
      toast.error('Proprietário sem WhatsApp cadastrado');
      return;
    }
    setCreatingClient(true);
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
        notes: `Proprietário do imóvel: ${ownerDeals[0]?.title || ownerDeals[0]?.endereco || 'N/A'}`,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente criado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao criar cliente: ' + err.message);
    } finally {
      setCreatingClient(false);
    }
  }, [user, owner, ownerDeals, queryClient]);

  function getStageForDeal(deal: any): OwnerStage {
    if (deal.proprietario_quer_comprar) return 'transicao_comprador';
    if (deal.status === 'sold') return 'vendido';
    if ((deal.proposals_count ?? 0) > 0) return 'com_proposta';
    return 'anunciado';
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-xl overflow-y-auto overscroll-contain pb-safe animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground truncate">{owner.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn(
                  'text-[10px] border-0',
                  OWNER_STAGE_BG_COLORS[owner.stage],
                  OWNER_STAGE_TEXT_COLORS[owner.stage]
                )}>
                  {OWNER_STAGE_LABELS[owner.stage]}
                </Badge>
                {owner.quer_comprar && (
                  <Badge className="text-[10px] border-0 bg-amber-500/10 text-amber-600">
                    <ShoppingCart className="w-2.5 h-2.5 mr-0.5" />Comprador
                  </Badge>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Contact Section */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Contato
            </h3>
            <div className="card-elevated p-3 space-y-2.5">
              {owner.whatsapp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {owner.whatsapp}
                  </div>
                  <button
                    onClick={() => openWhatsApp(owner.whatsapp!)}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                </div>
              )}
              {owner.email && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {owner.email}
                </div>
              )}
              {!owner.whatsapp && !owner.email && (
                <p className="text-sm text-muted-foreground">Nenhum contato registrado</p>
              )}
            </div>
          </section>

          {/* Action Buttons */}
          <section className="flex flex-wrap gap-2">
            <button
              onClick={toggleQuerComprar}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                owner.quer_comprar
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30'
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              {owner.quer_comprar ? 'Vendendo p/ Comprar ✓' : 'Vendendo p/ Comprar'}
            </button>
            {owner.whatsapp && (
              <button
                onClick={createAsClient}
                disabled={creatingClient}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border bg-card text-primary border-border hover:border-primary/30 disabled:opacity-50"
              >
                {creatingClient
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <UserPlus className="w-4 h-4" />}
                Criar Cliente
              </button>
            )}
          </section>

          {/* Summary */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Resumo
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="card-elevated p-3 text-center">
                <p className="text-lg font-bold text-foreground">{ownerDeals.length}</p>
                <p className="text-[10px] text-muted-foreground">Imóve{ownerDeals.length !== 1 ? 'is' : 'l'}</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-sm sm:text-lg font-bold text-accent break-all leading-tight">{formatCurrency(totalValue) || 'R$ 0'}</p>
                <p className="text-[10px] text-muted-foreground">Valor Total</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <button
                  onClick={toggleQuerComprar}
                  className={cn(
                    'text-lg font-bold transition-colors',
                    owner.quer_comprar ? 'text-amber-600' : 'text-muted-foreground'
                  )}
                >
                  {owner.quer_comprar ? '✓ Sim' : 'Não'}
                </button>
                <p className="text-[10px] text-muted-foreground">Quer Comprar</p>
              </div>
            </div>
          </section>

          {/* Properties */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Imóveis ({ownerDeals.length})
            </h3>

            <div className="space-y-3">
              {ownerDeals.map(deal => {
                const stage = getStageForDeal(deal);
                const areaLazer = Array.isArray(deal.area_lazer) ? deal.area_lazer as string[] : [];
                const dealClients = deal.deal_clients || [];

                return (
                  <div key={deal.id} className="card-elevated p-4 space-y-3">
                    {/* Title + Stage */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {deal.title || deal.endereco || 'Imóvel sem título'}
                        </p>
                        {deal.tipo && (
                          <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{deal.tipo.replace('_', ' ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={cn('text-[10px] border-0', OWNER_STAGE_BG_COLORS[stage], OWNER_STAGE_TEXT_COLORS[stage])}>
                          {OWNER_STAGE_LABELS[stage]}
                        </Badge>
                        <Badge className={cn('text-[10px] border-0',
                          deal.status === 'active' ? 'bg-emerald-500/10 text-emerald-600'
                          : deal.status === 'sold' ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-muted text-muted-foreground'
                        )}>
                          {DEAL_STATUS_LABELS[deal.status as DealStatus] || deal.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Image */}
                    {deal.listing_image_url && (
                      <img
                        src={deal.listing_image_url}
                        alt={deal.title || 'Imóvel'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}

                    {/* Address */}
                    <div className="flex items-start gap-1.5 text-xs text-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                      <span className="leading-tight">
                        {deal.endereco
                          ? `${deal.endereco}${deal.bairro ? `, ${deal.bairro}` : ''}`
                          : deal.bairro || 'Endereço não informado'}
                        {deal.cidade && ` - ${deal.cidade}`}
                        {deal.estado && `/${deal.estado}`}
                      </span>
                    </div>

                    {/* Specs */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {deal.metragem != null && deal.metragem > 0 && (
                        <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{deal.metragem}m²</span>
                      )}
                      {deal.quartos != null && deal.quartos > 0 && (
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{deal.quartos} qts</span>
                      )}
                      {(deal.suites ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{deal.suites} suíte{deal.suites! > 1 ? 's' : ''}</span>
                      )}
                      {(deal.banheiros ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{deal.banheiros} bnh</span>
                      )}
                      {deal.vagas != null && deal.vagas > 0 && (
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" />{deal.vagas} vg</span>
                      )}
                      {(deal.salas ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3" />{deal.salas} sala{deal.salas! > 1 ? 's' : ''}</span>
                      )}
                      {(deal.cozinhas ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><ChefHat className="w-3 h-3" />{deal.cozinhas} coz</span>
                      )}
                    </div>

                    {/* Elevators & Portaria */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {deal.elevador_social && (
                        <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />Elev. Social</span>
                      )}
                      {deal.elevador_servico && (
                        <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />Elev. Serviço</span>
                      )}
                      {deal.portaria && (
                        <span>{PORTARIA_LABELS[deal.portaria] || deal.portaria}</span>
                      )}
                    </div>

                    {/* Leisure */}
                    {areaLazer.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" /> Lazer
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {areaLazer.map((item, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Commission & Partnership */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {(deal.comissao_percentual ?? 0) > 0 && (
                        <span>Comissão: {deal.comissao_percentual}%</span>
                      )}
                      {deal.tem_parceria && (
                        <Badge variant="secondary" className="text-[10px]">Com Parceria</Badge>
                      )}
                    </div>

                    {/* Linked Clients */}
                    {dealClients.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> Clientes Vinculados ({dealClients.length})
                        </p>
                        <div className="space-y-1">
                          {dealClients.map(dc => (
                            <div key={dc.id} className="flex items-center justify-between text-xs bg-secondary/30 rounded-md px-2 py-1.5">
                              <span className="font-medium text-foreground">{dc.client?.name || 'Cliente'}</span>
                              <Badge className={cn('text-[9px] border-0 text-white', DEAL_CLIENT_STAGE_COLORS[dc.stage as DealClientStage])}>
                                {DEAL_CLIENT_STAGE_LABELS[dc.stage as DealClientStage] || dc.stage}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Value */}
                    {deal.valor && (
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                        <DollarSign className="w-4 h-4 text-accent" />
                        <span className="text-base font-bold text-accent">{formatCurrency(deal.valor)}</span>
                      </div>
                    )}

                    {/* Link to listing */}
                    {deal.listing_url && (
                      <a
                        href={deal.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver anúncio
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
