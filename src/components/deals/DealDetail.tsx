import { useState, useMemo } from 'react';
import { Deal, DealWithClients, DealClient, DealClientStage, DealProposal, DealInteraction, 
  DEAL_CLIENT_STAGE_LABELS, DEAL_CLIENT_STAGES_ORDER, DEAL_CLIENT_LOST_STAGES, DEAL_CLIENT_STAGE_COLORS,
  DEAL_STATUS_LABELS, DealStatus, PROPOSAL_TYPE_LABELS, ProposalComposition, PORTARIA_LABELS } from '@/types/deal';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import { useDeal, useDealClients, useDealProposals, useDealInteractions, useDealPartners, useUpdateDealClientStage, useCreateDealProposal, useLinkClientToDeal } from '@/hooks/useDeals';
import { useClients } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import { useClientMatches } from '@/hooks/useClientMatches';
import { useDealTasks, useCreateTask, getDeadlineInfo } from '@/hooks/useTasks';
import { TaskFormSimple } from '@/components/tasks/TaskFormSimple';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  X, DollarSign, MapPin, ExternalLink, Users, Clock, Plus, Loader2, FileText,
  ArrowRightLeft, UserPlus, Building, BedDouble, Car, Maximize2, Send, Phone, Pencil,
  RefreshCw, Sparkles, ClipboardList, Copy, Hash,
} from 'lucide-react';
import { EditDealForm } from './EditDealForm';

interface DealDetailProps {
  deal: DealWithClients;
  onClose: () => void;
  onClientSelect?: (client: Client) => void;
  zIndex?: number;
}

const formatCurrency = (value: number | null) => {
  if (!value) return 'A definir';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

export function DealDetail({ deal: initialDeal, onClose, onClientSelect, zIndex }: DealDetailProps) {
  const { data: freshDeal } = useDeal(initialDeal.id);
  const deal = freshDeal || initialDeal;
  const { data: dealClients = [], isLoading: loadingClients } = useDealClients(deal.id);
  const { data: proposals = [], isLoading: loadingProposals } = useDealProposals(deal.id);
  const { data: interactions = [], isLoading: loadingInteractions } = useDealInteractions(deal.id);
  const { data: partners = [] } = useDealPartners(deal.id);
  const { data: dealTasks = [] } = useDealTasks(deal.id);
  const createTask = useCreateTask();
  const { data: allClients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const linkedClientIds = useMemo(() => dealClients.map(dc => dc.client_id), [dealClients]);
  const { data: clientMatches = [], isRefreshing, refresh: refreshMatches } = useClientMatches({ deal, linkedClientIds });
  const updateStage = useUpdateDealClientStage();
  const createProposal = useCreateDealProposal();
  const linkClient = useLinkClientToDeal();

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showLinkClient, setShowLinkClient] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [proposalData, setProposalData] = useState({ client_id: '', valor_proposta: 0, composicao: [] as ProposalComposition[] });
  const [newComposition, setNewComposition] = useState<ProposalComposition>({ tipo: 'a_vista', valor: 0 });
  const [permutaDetalhes, setPermutaDetalhes] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Stage change justification popup state
  const [stagePopup, setStagePopup] = useState(false);
  const [stageNotes, setStageNotes] = useState('');
  const [pendingStageChange, setPendingStageChange] = useState<{ dc: DealClient; newStage: DealClientStage } | null>(null);

  const comissaoValor = deal.valor && deal.comissao_percentual ? (deal.valor * deal.comissao_percentual) / 100 : null;

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.full_name || 'Usuário';
  };

  const availableClients = useMemo(() => {
    const linkedIds = dealClients.map(dc => dc.client_id);
    return allClients.filter(c => !linkedIds.includes(c.id));
  }, [allClients, dealClients]);

  const handleStageChange = (dealClient: DealClient, newStage: DealClientStage) => {
    if (dealClient.stage === newStage) return;
    setPendingStageChange({ dc: dealClient, newStage });
    setStageNotes('');
    // Delay to avoid Radix Select/AlertDialog conflict
    setTimeout(() => setStagePopup(true), 100);
  };

  const confirmStageChange = () => {
    if (!pendingStageChange) return;
    const { dc, newStage } = pendingStageChange;
    updateStage.mutate({
      id: dc.id,
      stage: newStage,
      previousStage: dc.stage,
      deal_id: deal.id,
      client_name: dc.client?.name,
      client_id: dc.client_id,
      notes: stageNotes || undefined,
    });
    setStagePopup(false);
    setPendingStageChange(null);
    setStageNotes('');
  };

  const handleAddComposition = () => {
    const comp: ProposalComposition = { ...newComposition };
    if (comp.tipo === 'permuta') comp.detalhes = permutaDetalhes;
    setProposalData(prev => ({ ...prev, composicao: [...prev.composicao, comp] }));
    setNewComposition({ tipo: 'a_vista', valor: 0 });
    setPermutaDetalhes('');
  };

  const handleSubmitProposal = async () => {
    if (!proposalData.client_id || !proposalData.valor_proposta) return;
    await createProposal.mutateAsync({ deal_id: deal.id, ...proposalData });
    setProposalData({ client_id: '', valor_proposta: 0, composicao: [] });
    setShowProposalForm(false);
  };

  const handleLinkClient = async (clientId: string) => {
    await linkClient.mutateAsync({ deal_id: deal.id, client_id: clientId });
    setShowLinkClient(false);
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'client_linked': return <UserPlus className="w-4 h-4" />;
      case 'stage_change': return <ArrowRightLeft className="w-4 h-4" />;
      case 'proposal_added': return <DollarSign className="w-4 h-4" />;
      case 'created': return <Building className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Rich preview for listing URL
  const renderListingPreview = () => {
    if (!deal.listing_url) return null;
    return (
      <a href={deal.listing_url} target="_blank" rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all group">
        {deal.listing_image_url ? (
          <div className="relative w-full aspect-video overflow-hidden bg-muted">
            <img src={deal.listing_image_url} alt={deal.title || 'Imóvel'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="font-semibold text-white text-base line-clamp-2 drop-shadow-md">{deal.title || 'Ver anúncio'}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <Building className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="px-3 py-2.5 flex items-center justify-between gap-2 bg-secondary/20">
          <p className="text-xs text-muted-foreground truncate flex-1">{new URL(deal.listing_url).hostname}</p>
          <div className="flex items-center gap-1 text-xs text-accent font-medium shrink-0">
            <ExternalLink className="w-3 h-3" /> Abrir
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black/30 animate-fade-in" style={{ zIndex: zIndex || 50 }}>
      <div className="h-full w-full max-w-xl bg-card shadow-dramatic animate-slide-up overflow-y-auto overscroll-contain pb-safe">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-4 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground break-words">{deal.title || 'Negócio'}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="font-semibold text-foreground">{formatCurrency(deal.valor)}</span>
                <Badge variant={deal.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {DEAL_STATUS_LABELS[deal.status]}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowEditForm(true)} className="h-8 w-8">
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Listing Preview */}
          {renderListingPreview()}

          {/* Property Details */}
          <div className="card-elevated p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Detalhes do Imóvel</h3>

            {/* Property Code */}
            {(deal as any).codigo_imovel && (
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono font-medium">{(deal as any).codigo_imovel}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    navigator.clipboard.writeText((deal as any).codigo_imovel);
                    toast.success('Código copiado!');
                  }}
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            
            {/* Type */}
            {deal.tipo && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize font-medium">{deal.tipo.replace('_', ' ')}</span>
              </div>
            )}

            {/* Address */}
            <div className="space-y-1 text-sm">
              {deal.endereco && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{deal.endereco}</span>
                </div>
              )}
              {(deal.bairro || deal.cidade || deal.estado) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4" />
                  <span>{[deal.bairro, deal.cidade, deal.estado].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {(deal as any).numero_predio && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4" />
                  <span>
                    Nº {(deal as any).numero_predio}
                    {(deal as any).numero_apartamento ? ` / Apt ${(deal as any).numero_apartamento}` : ''}
                    {(deal as any).bloco ? ` - Bloco ${(deal as any).bloco}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {deal.quartos != null && deal.quartos > 0 && (
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center">
                  <BedDouble className="w-4 h-4 text-muted-foreground mb-1" />
                  <span className="font-semibold text-sm">{deal.quartos}</span>
                  <span className="text-[10px] text-muted-foreground">Quartos</span>
                </div>
              )}
              {deal.suites != null && deal.suites > 0 && (
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center">
                  <BedDouble className="w-4 h-4 text-accent mb-1" />
                  <span className="font-semibold text-sm">{deal.suites}</span>
                  <span className="text-[10px] text-muted-foreground">Suítes</span>
                </div>
              )}
              {deal.banheiros != null && deal.banheiros > 0 && (
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center">
                  <span className="text-muted-foreground mb-1 text-xs">🚿</span>
                  <span className="font-semibold text-sm">{deal.banheiros}</span>
                  <span className="text-[10px] text-muted-foreground">Banheiros</span>
                </div>
              )}
              {deal.vagas != null && deal.vagas > 0 && (
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center">
                  <Car className="w-4 h-4 text-muted-foreground mb-1" />
                  <span className="font-semibold text-sm">{deal.vagas}</span>
                  <span className="text-[10px] text-muted-foreground">Vagas</span>
                </div>
              )}
              {deal.metragem != null && deal.metragem > 0 && (
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center">
                  <Maximize2 className="w-4 h-4 text-muted-foreground mb-1" />
                  <span className="font-semibold text-sm">{deal.metragem}m²</span>
                  <span className="text-[10px] text-muted-foreground">Área</span>
                </div>
              )}
              {deal.salas != null && deal.salas > 0 && (
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30 text-center">
                  <span className="text-muted-foreground mb-1 text-xs">🛋️</span>
                  <span className="font-semibold text-sm">{deal.salas}</span>
                  <span className="text-[10px] text-muted-foreground">Salas</span>
                </div>
              )}
            </div>

            {/* Elevators & Portaria */}
            {(deal.elevador_social || deal.elevador_servico || (deal as any).portaria) && (
              <div className="flex flex-wrap gap-2 text-xs">
                {deal.elevador_social && <Badge variant="outline">Elevador Social</Badge>}
                {deal.elevador_servico && <Badge variant="outline">Elevador Serviço</Badge>}
                {(deal as any).portaria && <Badge variant="outline">{PORTARIA_LABELS[(deal as any).portaria] || (deal as any).portaria}</Badge>}
              </div>
            )}

            {/* Leisure */}
            {deal.area_lazer && deal.area_lazer.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Área de Lazer</span>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Map(deal.area_lazer.map(item => [item.toLowerCase().trim(), item])).values()).map((item, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Commission */}
            {comissaoValor && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Comissão ({deal.comissao_percentual}%)</span>
                <span className="font-semibold text-accent">{formatCurrency(comissaoValor)}</span>
              </div>
            )}
          </div>

          {/* Owner */}
          {deal.proprietario_nome && (
            <div className="card-elevated p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Proprietário</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{deal.proprietario_nome}</p>
                    {deal.proprietario_whatsapp && (
                      <p className="text-xs text-muted-foreground">{deal.proprietario_whatsapp}</p>
                    )}
                  </div>
                </div>
                {deal.proprietario_whatsapp && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => {
                      const phone = deal.proprietario_whatsapp!.replace(/\D/g, '');
                      window.open(`https://wa.me/${phone}`, '_blank');
                    }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Partners */}
          {partners.length > 0 && (
            <div className="card-elevated p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Parceiros</h3>
              {partners.map(partner => (
                <div key={partner.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/30">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{partner.nome}</p>
                      {partner.whatsapp && (
                        <p className="text-xs text-muted-foreground">{partner.whatsapp}</p>
                      )}
                    </div>
                  </div>
                  {partner.whatsapp && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      onClick={() => {
                        const phone = partner.whatsapp!.replace(/\D/g, '');
                        window.open(`https://wa.me/${phone}`, '_blank');
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Proposals */}
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Propostas <Badge variant="secondary" className="text-xs">{proposals.length}</Badge>
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowProposalForm(!showProposalForm)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Nova
              </Button>
            </div>

            {showProposalForm && (
              <div className="space-y-3 p-3 rounded-lg border border-border bg-secondary/10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cliente</Label>
                    <select value={proposalData.client_id} onChange={e => setProposalData(prev => ({ ...prev, client_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                      <option value="">Selecione...</option>
                      {dealClients.map(dc => <option key={dc.client_id} value={dc.client_id}>{dc.client?.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor Total (R$)</Label>
                    <Input type="number" value={proposalData.valor_proposta || ''} onChange={e => setProposalData(prev => ({ ...prev, valor_proposta: Number(e.target.value) }))} />
                  </div>
                </div>

                {/* Composition */}
                <div className="space-y-2">
                  <Label className="text-xs">Composição do Pagamento</Label>
                  {proposalData.composicao.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-card p-2 rounded">
                      <span className="font-medium">{PROPOSAL_TYPE_LABELS[c.tipo]}</span>
                      <span>{formatCurrency(c.valor)}</span>
                      {c.detalhes && <span className="text-muted-foreground break-words">- {c.detalhes}</span>}
                    </div>
                  ))}
                  <div className="flex gap-2 items-end">
                    <select value={newComposition.tipo} onChange={e => setNewComposition(prev => ({ ...prev, tipo: e.target.value as any }))}
                      className="px-2 py-1.5 rounded border border-border bg-background text-xs">
                      {Object.entries(PROPOSAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <Input type="number" placeholder="Valor" className="h-8 text-xs" value={newComposition.valor || ''} onChange={e => setNewComposition(prev => ({ ...prev, valor: Number(e.target.value) }))} />
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleAddComposition}><Plus className="w-3 h-3" /></Button>
                  </div>
                  {newComposition.tipo === 'permuta' && (
                    <Textarea placeholder="Detalhes da permuta..." className="text-xs" value={permutaDetalhes} onChange={e => setPermutaDetalhes(e.target.value)} />
                  )}
                </div>

                <Button size="sm" onClick={handleSubmitProposal} disabled={createProposal.isPending || !proposalData.client_id || !proposalData.valor_proposta} className="w-full">
                  {createProposal.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Adicionar Proposta
                </Button>
              </div>
            )}

            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {proposals.map(p => (
                  <div key={p.id} className="p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{p.client?.name || 'Cliente'}</span>
                      <span className="font-semibold text-accent text-sm">{formatCurrency(p.valor_proposta)}</span>
                    </div>
                    {p.composicao.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.composicao.map((c: ProposalComposition, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {PROPOSAL_TYPE_LABELS[c.tipo]}: {formatCurrency(c.valor)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Client Matches */}
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Clientes Compatíveis
                <Badge variant="secondary" className="text-xs">{clientMatches.length}</Badge>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={refreshMatches}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
                Atualizar
              </Button>
            </div>
            {clientMatches.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum cliente compatível encontrado.
              </p>
            ) : (
              <div className={cn(
                "overflow-y-auto",
                clientMatches.length <= 1 ? "max-h-[100px]" : clientMatches.length <= 3 ? "max-h-[240px]" : "max-h-[320px]"
              )}>
                <div className="space-y-2">
                  {clientMatches.map(match => {
                    const matchClient = allClients.find(c => c.id === match.id);
                    return (
                    <div key={match.id} className={cn("p-3 rounded-lg border border-border bg-card flex items-start justify-between gap-2", onClientSelect && matchClient && "cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all")}
                      onClick={() => onClientSelect && matchClient && onClientSelect(matchClient)}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{match.name}</span>
                          <Badge variant="default" className="text-[10px] shrink-0">
                            {match.matchScore}%
                          </Badge>
                        </div>
                        {match.preferred_region && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0" /> <span className="break-words">{match.preferred_region}</span>
                          </p>
                        )}
                        {match.budget_max && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Orçamento: {formatCurrency(match.budget_max)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {match.matchReasons.map((reason, i) => (
                            <span key={i} className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); handleLinkClient(match.id); }}>
                        <UserPlus className="w-3 h-3" /> Vincular
                      </Button>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Linked Clients with Stages */}
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Clientes Vinculados <Badge variant="secondary" className="text-xs">{dealClients.length}</Badge>
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowLinkClient(!showLinkClient)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Vincular
              </Button>
            </div>

            {showLinkClient && (
              <div className="p-3 rounded-lg border border-border bg-secondary/10 space-y-2">
                <Label className="text-xs">Selecione o cliente</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableClients.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum cliente disponível</p>
                  ) : (
                    availableClients.map(c => (
                      <button key={c.id} onClick={() => handleLinkClient(c.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-card text-sm transition-colors">
                        {c.name} - {c.phone}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {dealClients.map(dc => {
                const linkedClient = allClients.find(c => c.id === dc.client_id);
                return (
                <div key={dc.id} className={cn("p-3 rounded-lg border border-border bg-card space-y-2", onClientSelect && linkedClient && "cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all")}
                  onClick={() => onClientSelect && linkedClient && onClientSelect(linkedClient)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{dc.client?.name || 'Cliente'}</span>
                    <div onClick={(e) => e.stopPropagation()}>
                    <Select value={dc.stage} onValueChange={(v) => handleStageChange(dc, v as DealClientStage)}>
                      <SelectTrigger className="w-auto h-7 text-xs gap-1 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...DEAL_CLIENT_STAGES_ORDER, ...DEAL_CLIENT_LOST_STAGES].map(s => (
                          <SelectItem key={s} value={s} className="text-xs">{DEAL_CLIENT_STAGE_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                  {/* Stage progress bar */}
                  <div className="flex items-center gap-0.5">
                    {DEAL_CLIENT_STAGES_ORDER.map((stage, i) => {
                      const currentIdx = DEAL_CLIENT_STAGES_ORDER.indexOf(dc.stage);
                      const isLost = DEAL_CLIENT_LOST_STAGES.includes(dc.stage);
                      return (
                        <div key={stage} className={cn('h-1.5 flex-1 rounded-full', 
                          isLost ? 'bg-destructive/30' : i <= currentIdx ? 'bg-accent' : 'bg-secondary'
                        )} />
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Tasks */}
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Tarefas
                <Badge variant="secondary" className="text-xs">{dealTasks.filter(t => t.status === 'pending').length}</Badge>
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Tarefa
              </Button>
            </div>
            {showTaskForm && (
              <TaskFormSimple
                onSubmit={async (data) => {
                  await createTask.mutateAsync({ ...data, deal_id: deal.id });
                  setShowTaskForm(false);
                }}
                onCancel={() => setShowTaskForm(false)}
                isLoading={createTask.isPending}
                defaultDealId={deal.id}
                hideDeal
              />
            )}
            {dealTasks.length > 0 && (
              <div className="space-y-2">
                {dealTasks.map(task => {
                  const deadline = getDeadlineInfo(task.due_date, task.status);
                  return (
                    <div key={task.id} className={cn("p-3 rounded-lg border border-border bg-card", task.status === 'completed' && 'opacity-60')}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm font-medium", task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full shrink-0',
                          deadline.variant === 'overdue' && 'bg-destructive/10 text-destructive',
                          deadline.variant === 'today' && 'bg-amber-100 text-amber-700',
                          deadline.variant === 'ontime' && 'bg-emerald-100 text-emerald-700',
                          deadline.variant === 'completed' && 'bg-secondary text-muted-foreground',
                        )}>{deadline.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Prazo: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card-elevated p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Histórico
            </h3>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {interactions.map(interaction => (
                  <div key={interaction.id} className="flex gap-3 items-start">
                    <div className={cn('p-1.5 rounded-full mt-0.5',
                      interaction.type === 'stage_change' ? 'bg-accent/10 text-accent' :
                      interaction.type === 'client_linked' ? 'bg-blue-100 text-blue-600' :
                      interaction.type === 'proposal_added' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-secondary text-muted-foreground'
                    )}>
                      {getInteractionIcon(interaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{interaction.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{getUserName(interaction.created_by)}</span>
                        <span>•</span>
                        <span>{format(new Date(interaction.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {showEditForm && (
        <EditDealForm deal={deal} onClose={() => setShowEditForm(false)} />
      )}

      {/* Stage Change Justification Popup */}
      <AlertDialog open={stagePopup} onOpenChange={setStagePopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Motivo da alteração de estágio</AlertDialogTitle>
            <AlertDialogDescription>
              Descreva o motivo da alteração do estágio do cliente vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Descreva o motivo..."
            value={stageNotes}
            onChange={(e) => setStageNotes(e.target.value)}
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setStagePopup(false); setPendingStageChange(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStageChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
