import { useState, useMemo } from 'react';
import { useDeals, useLinkClientToDeal, useUpdateDealClientStage } from '@/hooks/useDeals';
import { DealClientStage, DEAL_CLIENT_STAGE_LABELS, DEAL_CLIENT_STAGES_ORDER, DEAL_CLIENT_LOST_STAGES, DealWithClients, PROPERTY_TYPE_OPTIONS_DEAL, LAZER_OPTIONS, PORTARIA_OPTIONS } from '@/types/deal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import {
  Home, Link2, Loader2, MapPin, DollarSign, BedDouble, Car, Maximize2,
  ExternalLink, Plus, Search, X, SlidersHorizontal, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedPropertiesProps {
  clientId: string;
  clientName?: string;
  onDealSelect?: (deal: DealWithClients) => void;
}

interface LinkFilters {
  endereco: string;
  bairro: string;
  cidade: string;
  tipo: string;
  quartosMin: string;
  suitesMin: string;
  banheirosMin: string;
  vagasMin: string;
  valorMin: string;
  valorMax: string;
  metragensMin: string;
  portaria: string;
  lazer: string[];
}

const emptyFilters: LinkFilters = {
  endereco: '', bairro: '', cidade: '', tipo: '',
  quartosMin: '', suitesMin: '', banheirosMin: '', vagasMin: '',
  valorMin: '', valorMax: '', metragensMin: '', portaria: '', lazer: [],
};

export function LinkedProperties({ clientId, clientName, onDealSelect }: LinkedPropertiesProps) {
  const { data: deals = [], isLoading } = useDeals();
  const linkClient = useLinkClientToDeal();
  const updateStage = useUpdateDealClientStage();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LinkFilters>(emptyFilters);

  // Stage change justification popup state
  const [stagePopup, setStagePopup] = useState(false);
  const [stageNotes, setStageNotes] = useState('');
  const [pendingStageChange, setPendingStageChange] = useState<{
    deal: DealWithClients;
    newStage: DealClientStage;
  } | null>(null);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.endereco) c++;
    if (filters.bairro) c++;
    if (filters.cidade) c++;
    if (filters.tipo) c++;
    if (filters.quartosMin) c++;
    if (filters.suitesMin) c++;
    if (filters.banheirosMin) c++;
    if (filters.vagasMin) c++;
    if (filters.valorMin) c++;
    if (filters.valorMax) c++;
    if (filters.metragensMin) c++;
    if (filters.portaria) c++;
    if (filters.lazer.length > 0) c++;
    return c;
  }, [filters]);

  const updateFilter = (key: keyof LinkFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  // Get deals linked to this client
  const linkedDeals = deals.filter(deal =>
    deal.deal_clients?.some(dc => dc.client_id === clientId)
  );

  // Get deals NOT linked to this client (for linking dialog) with filters
  const availableDeals = useMemo(() => {
    return deals
      .filter(d => d.status === 'active' && !d.deal_clients?.some(dc => dc.client_id === clientId))
      .filter(d => {
        // Text search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = d.title?.toLowerCase().includes(q) ||
            d.bairro?.toLowerCase().includes(q) ||
            d.cidade?.toLowerCase().includes(q) ||
            d.endereco?.toLowerCase().includes(q) ||
            (d as any).codigo_imovel?.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Advanced filters
        if (filters.endereco && !(d.endereco?.toLowerCase().includes(filters.endereco.toLowerCase()))) return false;
        if (filters.bairro && !(d.bairro?.toLowerCase().includes(filters.bairro.toLowerCase()))) return false;
        if (filters.cidade && !(d.cidade?.toLowerCase().includes(filters.cidade.toLowerCase()))) return false;
        if (filters.tipo && d.tipo !== filters.tipo) return false;
        if (filters.quartosMin && (d.quartos == null || d.quartos < Number(filters.quartosMin))) return false;
        if (filters.suitesMin && (d.suites == null || d.suites < Number(filters.suitesMin))) return false;
        if (filters.banheirosMin && (d.banheiros == null || d.banheiros < Number(filters.banheirosMin))) return false;
        if (filters.vagasMin && (d.vagas == null || d.vagas < Number(filters.vagasMin))) return false;
        if (filters.valorMin && (d.valor == null || d.valor < Number(filters.valorMin))) return false;
        if (filters.valorMax && (d.valor == null || d.valor > Number(filters.valorMax))) return false;
        if (filters.metragensMin && (d.metragem == null || d.metragem < Number(filters.metragensMin))) return false;
        if (filters.portaria && (d as any).portaria !== filters.portaria) return false;
        if (filters.lazer.length > 0) {
          const dealLazer = (d.area_lazer || []).map((l: string) => l.toLowerCase().trim());
          const allMatch = filters.lazer.every(fl => dealLazer.some(dl => dl.includes(fl.toLowerCase())));
          if (!allMatch) return false;
        }

        return true;
      });
  }, [deals, clientId, searchQuery, filters]);

  const handleLink = async (dealId: string) => {
    setLinkingId(dealId);
    try {
      await linkClient.mutateAsync({ deal_id: dealId, client_id: clientId });
    } catch {
      // handled by mutation
    } finally {
      setLinkingId(null);
    }
  };

  const getDealClient = (deal: DealWithClients) => {
    return deal.deal_clients?.find(dc => dc.client_id === clientId) || null;
  };

  const handleStageChange = (deal: DealWithClients, newStage: DealClientStage) => {
    const dc = getDealClient(deal);
    if (!dc || dc.stage === newStage) return;
    setPendingStageChange({ deal, newStage });
    setStageNotes('');
    setTimeout(() => setStagePopup(true), 100);
  };

  const confirmStageChange = () => {
    if (!pendingStageChange) return;
    const dc = getDealClient(pendingStageChange.deal);
    if (!dc) return;
    updateStage.mutate({
      id: dc.id,
      stage: pendingStageChange.newStage,
      previousStage: dc.stage,
      deal_id: pendingStageChange.deal.id,
      client_name: clientName,
      client_id: clientId,
      notes: stageNotes || undefined,
    });
    setStagePopup(false);
    setPendingStageChange(null);
    setStageNotes('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {linkedDeals.length} imóve{linkedDeals.length !== 1 ? 'is' : 'l'} vinculado{linkedDeals.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowLinkDialog(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Vincular
        </Button>
      </div>

      {linkedDeals.length === 0 ? (
        <div className="text-center py-4">
          <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum imóvel vinculado.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Vincular" para associar imóveis.</p>
        </div>
      ) : (
        <ScrollArea className={cn("pr-2", linkedDeals.length <= 2 ? "h-auto" : "h-[300px]")}>
          <div className="space-y-2">
            {linkedDeals.map((deal) => {
              const dc = getDealClient(deal);
              const currentStage = dc?.stage || 'enviado';
              return (
                <div key={deal.id} className={cn("p-2.5 rounded-lg bg-secondary/30 border border-border/50 space-y-2", onDealSelect && "cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all")}
                  onClick={() => onDealSelect && onDealSelect(deal)}>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {deal.listing_image_url ? (
                        <img src={deal.listing_image_url} alt={deal.title || 'Imóvel'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-medium text-xs line-clamp-1 text-foreground">{deal.title || 'Sem título'}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{deal.bairro || 'Local não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-accent flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />{formatCurrency(deal.valor)}
                        </span>
                        <div className="flex gap-1.5 text-[10px] text-muted-foreground">
                          {deal.quartos && <span className="flex items-center gap-0.5"><BedDouble className="h-2.5 w-2.5" />{deal.quartos}</span>}
                          {deal.vagas && <span className="flex items-center gap-0.5"><Car className="h-2.5 w-2.5" />{deal.vagas}</span>}
                          {deal.metragem && <span className="flex items-center gap-0.5"><Maximize2 className="h-2.5 w-2.5" />{deal.metragem}m²</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  {dc && (
                    <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5 flex-1">
                        {DEAL_CLIENT_STAGES_ORDER.map((stage, i) => {
                          const currentIdx = DEAL_CLIENT_STAGES_ORDER.indexOf(currentStage as DealClientStage);
                          const isLost = DEAL_CLIENT_LOST_STAGES.includes(currentStage as DealClientStage);
                          return (
                            <div key={stage} className={cn('h-1.5 flex-1 rounded-full',
                              isLost ? 'bg-destructive/30' : i <= currentIdx ? 'bg-accent' : 'bg-secondary'
                            )} />
                          );
                        })}
                      </div>
                      <Select value={currentStage} onValueChange={(v) => handleStageChange(deal, v as DealClientStage)}>
                        <SelectTrigger className="w-auto h-6 text-[10px] gap-1 px-2 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...DEAL_CLIENT_STAGES_ORDER, ...DEAL_CLIENT_LOST_STAGES].map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{DEAL_CLIENT_STAGE_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Stage Change Justification Popup */}
      <AlertDialog open={stagePopup} onOpenChange={setStagePopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Motivo da alteração de estágio</AlertDialogTitle>
            <AlertDialogDescription>
              Descreva o motivo da alteração do estágio do imóvel vinculado.
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

      {/* Link Dialog with Filters */}
      <Dialog open={showLinkDialog} onOpenChange={(open) => {
        setShowLinkDialog(open);
        if (!open) { setSearchQuery(''); setFilters(emptyFilters); setShowFilters(false); }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
            <DialogTitle className="text-base">Vincular Imóvel ao Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="px-4 space-y-3 shrink-0">
            {/* Search + Filter toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar imóvel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 gap-1 relative text-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="space-y-2.5 p-3 rounded-lg border border-border bg-secondary/20 animate-fade-in max-h-[40vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Filtros Avançados</span>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-5 text-[10px] text-muted-foreground gap-1 px-1">
                      <X className="w-2.5 h-2.5" /> Limpar
                    </Button>
                  )}
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Rua</Label>
                    <Input placeholder="Rua..." value={filters.endereco} onChange={e => updateFilter('endereco', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Bairro</Label>
                    <Input placeholder="Bairro..." value={filters.bairro} onChange={e => updateFilter('bairro', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Cidade</Label>
                    <Input placeholder="Cidade..." value={filters.cidade} onChange={e => updateFilter('cidade', e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>

                {/* Type + Value */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Tipo</Label>
                    <select value={filters.tipo} onChange={e => updateFilter('tipo', e.target.value)} className="w-full h-7 px-2 rounded-md border border-input bg-background text-foreground text-xs">
                      <option value="">Todos</option>
                      {PROPERTY_TYPE_OPTIONS_DEAL.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Valor mín</Label>
                    <Input type="number" placeholder="0" value={filters.valorMin} onChange={e => updateFilter('valorMin', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Valor máx</Label>
                    <Input type="number" placeholder="∞" value={filters.valorMax} onChange={e => updateFilter('valorMax', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Área mín</Label>
                    <Input type="number" placeholder="0" value={filters.metragensMin} onChange={e => updateFilter('metragensMin', e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>

                {/* Rooms + Portaria */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Quartos</Label>
                    <Input type="number" min={0} placeholder="0" value={filters.quartosMin} onChange={e => updateFilter('quartosMin', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Suítes</Label>
                    <Input type="number" min={0} placeholder="0" value={filters.suitesMin} onChange={e => updateFilter('suitesMin', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Banheiros</Label>
                    <Input type="number" min={0} placeholder="0" value={filters.banheirosMin} onChange={e => updateFilter('banheirosMin', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Vagas</Label>
                    <Input type="number" min={0} placeholder="0" value={filters.vagasMin} onChange={e => updateFilter('vagasMin', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Portaria</Label>
                    <select value={filters.portaria} onChange={e => updateFilter('portaria', e.target.value)} className="w-full h-7 px-1 rounded-md border border-input bg-background text-foreground text-[10px]">
                      <option value="">Todas</option>
                      {PORTARIA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Leisure */}
                <div className="space-y-0.5">
                  <Label className="text-[10px]">Lazer</Label>
                  <div className="flex flex-wrap gap-1">
                    {LAZER_OPTIONS.map(item => {
                      const isSelected = filters.lazer.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => updateFilter('lazer', isSelected ? filters.lazer.filter(l => l !== item) : [...filters.lazer, item])}
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors',
                            isSelected
                              ? 'bg-accent text-white border-accent'
                              : 'bg-secondary text-muted-foreground border-border hover:border-accent/50'
                          )}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Results count */}
            <p className="text-[10px] text-muted-foreground">{availableDeals.length} imóve{availableDeals.length !== 1 ? 'is' : 'l'} disponíve{availableDeals.length !== 1 ? 'is' : 'l'}</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {availableDeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || activeFilterCount > 0 ? 'Nenhum imóvel encontrado com esses filtros.' : 'Todos os imóveis ativos já estão vinculados.'}
                  </p>
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 text-xs">Limpar filtros</Button>
                  )}
                </div>
              ) : (
                availableDeals.map((deal) => (
                  <div key={deal.id} className="flex gap-3 p-2.5 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {deal.listing_image_url ? (
                        <img src={deal.listing_image_url} alt={deal.title || 'Imóvel'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="font-medium text-xs line-clamp-1 text-foreground">{deal.title || 'Sem título'}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {deal.bairro}{deal.cidade && `, ${deal.cidade}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-accent">{formatCurrency(deal.valor)}</span>
                        <div className="flex gap-1.5 text-[10px] text-muted-foreground">
                          {deal.quartos && <span>{deal.quartos}q</span>}
                          {deal.vagas && <span>{deal.vagas}v</span>}
                          {deal.metragem && <span>{deal.metragem}m²</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs self-center"
                      onClick={() => handleLink(deal.id)}
                      disabled={linkingId === deal.id}
                    >
                      {linkingId === deal.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <><Link2 className="h-3 w-3 mr-1" />Vincular</>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
