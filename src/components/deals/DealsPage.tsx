import { useState, useMemo } from 'react';
import { DealWithClients, DealStatus, DEAL_STATUS_LABELS, PROPERTY_TYPE_OPTIONS_DEAL, LAZER_OPTIONS, PORTARIA_OPTIONS, PORTARIA_LABELS } from '@/types/deal';
import { useDeals } from '@/hooks/useDeals';
import { useClients } from '@/hooks/useClients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Loader2, MapPin, Bed, Car, Maximize, Plus, Users, FileText, DollarSign, Sparkles,
  SlidersHorizontal, X, ChevronDown, ChevronUp,
} from 'lucide-react';

interface DealsPageProps {
  onDealSelect: (deal: DealWithClients) => void;
  onNewDeal: () => void;
}

const formatCurrency = (value: number | null) => {
  if (!value) return 'A definir';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

type StatusFilter = DealStatus;

const statusFilters: { value: StatusFilter; label: string; activeClass: string }[] = [
  { value: 'active', label: 'Ativos', activeClass: 'bg-blue-500 text-white' },
  { value: 'sold', label: 'Vendidos', activeClass: 'bg-emerald-500 text-white' },
  { value: 'cancelled', label: 'Inativos', activeClass: 'bg-destructive text-destructive-foreground' },
];

interface Filters {
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

const emptyFilters: Filters = {
  endereco: '',
  bairro: '',
  cidade: '',
  tipo: '',
  quartosMin: '',
  suitesMin: '',
  banheirosMin: '',
  vagasMin: '',
  valorMin: '',
  valorMax: '',
  metragensMin: '',
  portaria: '',
  lazer: [],
};

function DealCard({ deal, onClick, compatibleCount }: { deal: DealWithClients & { proposals_count?: number }; onClick: () => void; compatibleCount: number }) {
  const mainPhoto = deal.listing_image_url || '/placeholder.svg';
  const comissaoValor = deal.valor && deal.comissao_percentual
    ? (deal.valor * deal.comissao_percentual) / 100
    : null;

  return (
    <div
      onClick={onClick}
      className="card-elevated overflow-hidden cursor-pointer hover:shadow-prominent transition-all duration-200 group"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={mainPhoto}
          alt={deal.title || 'Imóvel'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <span className={cn(
          'absolute top-2 left-2 px-2.5 py-1 text-xs font-medium rounded-full',
          deal.status === 'active' ? 'bg-blue-500 text-white' :
          deal.status === 'sold' ? 'bg-emerald-500 text-white' :
          'bg-destructive text-destructive-foreground'
        )}>
          {DEAL_STATUS_LABELS[deal.status]}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
          {deal.title || 'Sem título'}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {[deal.bairro, deal.cidade, deal.estado].filter(Boolean).join(', ') || 'Local não informado'}
          </span>
        </div>
        <p className="text-base font-bold text-accent">
          {formatCurrency(deal.valor)}
        </p>

        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          {deal.quartos && (
            <div className="flex items-center gap-1"><Bed className="w-4 h-4" /><span>{deal.quartos}</span></div>
          )}
          {deal.vagas && (
            <div className="flex items-center gap-1"><Car className="w-4 h-4" /><span>{deal.vagas}</span></div>
          )}
          {deal.metragem && (
            <div className="flex items-center gap-1"><Maximize className="w-4 h-4" /><span>{deal.metragem}m²</span></div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" title="Clientes compatíveis">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /><span className="font-medium">{compatibleCount}</span>
          </div>
          <div className="flex items-center gap-1" title="Clientes vinculados">
            <Users className="w-3.5 h-3.5" /><span>{deal.deal_clients.length}</span>
          </div>
          <div className="flex items-center gap-1" title="Propostas">
            <FileText className="w-3.5 h-3.5" /><span>{deal.proposals_count || 0}</span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Comissão {deal.comissao_percentual ? `(${deal.comissao_percentual}%)` : ''}</p>
            <p className="text-lg font-bold text-accent">{comissaoValor ? formatCurrency(comissaoValor) : 'A definir'}</p>
          </div>
          <Button size="sm" className="text-xs">Ver detalhes</Button>
        </div>
      </div>
    </div>
  );
}

export function DealsPage({ onDealSelect, onNewDeal }: DealsPageProps) {
  const { data: deals = [], isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const { data: clients = [] } = useClients();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.endereco) count++;
    if (filters.bairro) count++;
    if (filters.cidade) count++;
    if (filters.tipo) count++;
    if (filters.quartosMin) count++;
    if (filters.suitesMin) count++;
    if (filters.banheirosMin) count++;
    if (filters.vagasMin) count++;
    if (filters.valorMin) count++;
    if (filters.valorMax) count++;
    if (filters.metragensMin) count++;
    if (filters.portaria) count++;
    if (filters.lazer.length > 0) count++;
    return count;
  }, [filters]);

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  const compatibleCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    deals.forEach(deal => {
      const linkedIds = new Set(deal.deal_clients?.map(dc => dc.client_id) || []);
      let count = 0;
      clients.forEach(client => {
        if (linkedIds.has(client.id) || client.stage === 'lost') return;
        let score = 50;
        if (deal.bairro) {
          const db = deal.bairro.toLowerCase().trim();
          let matched = false;
          if (client.preferred_region) {
            const regions = client.preferred_region.toLowerCase().split(',').map(r => r.trim()).filter(Boolean);
            matched = regions.some(r => db.includes(r) || r.includes(db));
          }
          if (!matched && client.cidades?.length) {
            matched = client.cidades.some(c => db.includes(c.toLowerCase().trim()) || c.toLowerCase().trim().includes(db));
          }
          score += matched ? 25 : -30;
        }
        if (deal.valor && client.budget_max) {
          score += deal.valor <= client.budget_max ? 15 : deal.valor <= client.budget_max * 1.1 ? 8 : -15;
        }
        if (deal.valor && client.budget_min && deal.valor < client.budget_min) score -= 10;
        if (deal.quartos && client.bedrooms_min) score += deal.quartos >= client.bedrooms_min ? 10 : -10;
        if (deal.vagas && client.parking_min) score += deal.vagas >= client.parking_min ? 5 : -5;
        if (deal.metragem && client.area_min) {
          score += deal.metragem >= client.area_min ? 10 : deal.metragem >= client.area_min * 0.9 ? 5 : -10;
        }
        if (Math.max(0, Math.min(100, score)) >= 100) count++;
      });
      map[deal.id] = count;
    });
    return map;
  }, [deals, clients]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Text search
      const q = searchQuery.toLowerCase();
      if (q) {
        const matchesSearch =
          (deal.title?.toLowerCase().includes(q) ?? false) ||
          (deal.bairro?.toLowerCase().includes(q) ?? false) ||
          (deal.cidade?.toLowerCase().includes(q) ?? false) ||
          ((deal as any).codigo_imovel?.toLowerCase().includes(q) ?? false);
        if (!matchesSearch) return false;
      }

      // Status
      if (deal.status !== statusFilter) return false;

      // Advanced filters
      if (filters.endereco && !(deal.endereco?.toLowerCase().includes(filters.endereco.toLowerCase()))) return false;
      if (filters.bairro && !(deal.bairro?.toLowerCase().includes(filters.bairro.toLowerCase()))) return false;
      if (filters.cidade && !(deal.cidade?.toLowerCase().includes(filters.cidade.toLowerCase()))) return false;
      if (filters.tipo && deal.tipo !== filters.tipo) return false;
      if (filters.quartosMin && (deal.quartos == null || deal.quartos < Number(filters.quartosMin))) return false;
      if (filters.suitesMin && (deal.suites == null || deal.suites < Number(filters.suitesMin))) return false;
      if (filters.banheirosMin && (deal.banheiros == null || deal.banheiros < Number(filters.banheirosMin))) return false;
      if (filters.vagasMin && (deal.vagas == null || deal.vagas < Number(filters.vagasMin))) return false;
      if (filters.valorMin && (deal.valor == null || deal.valor < Number(filters.valorMin))) return false;
      if (filters.valorMax && (deal.valor == null || deal.valor > Number(filters.valorMax))) return false;
      if (filters.metragensMin && (deal.metragem == null || deal.metragem < Number(filters.metragensMin))) return false;
      if (filters.portaria && (deal as any).portaria !== filters.portaria) return false;
      if (filters.lazer.length > 0) {
        const dealLazer = (deal.area_lazer || []).map((l: string) => l.toLowerCase().trim());
        const allMatch = filters.lazer.every(fl => dealLazer.some(dl => dl.includes(fl.toLowerCase())));
        if (!allMatch) return false;
      }

      return true;
    });
  }, [deals, searchQuery, statusFilter, filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Search + Filters + New */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar imóveis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5 relative"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
        <Button onClick={onNewDeal} size="sm" className="gradient-gold text-white gap-1.5">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Imóvel</span>
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card-elevated p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Filtros Avançados</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground gap-1">
                <X className="w-3 h-3" /> Limpar filtros
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rua / Endereço</Label>
              <Input placeholder="Ex: Rua das Flores" value={filters.endereco} onChange={e => updateFilter('endereco', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro</Label>
              <Input placeholder="Ex: Lourdes" value={filters.bairro} onChange={e => updateFilter('bairro', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cidade</Label>
              <Input placeholder="Ex: Belo Horizonte" value={filters.cidade} onChange={e => updateFilter('cidade', e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <select value={filters.tipo} onChange={e => updateFilter('tipo', e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm">
                <option value="">Todos</option>
                {PROPERTY_TYPE_OPTIONS_DEAL.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor mín (R$)</Label>
              <Input type="number" placeholder="0" value={filters.valorMin} onChange={e => updateFilter('valorMin', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor máx (R$)</Label>
              <Input type="number" placeholder="∞" value={filters.valorMax} onChange={e => updateFilter('valorMax', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Metragem mín (m²)</Label>
              <Input type="number" placeholder="0" value={filters.metragensMin} onChange={e => updateFilter('metragensMin', e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Rooms */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Quartos mín</Label>
              <Input type="number" min={0} placeholder="0" value={filters.quartosMin} onChange={e => updateFilter('quartosMin', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Suítes mín</Label>
              <Input type="number" min={0} placeholder="0" value={filters.suitesMin} onChange={e => updateFilter('suitesMin', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Banheiros mín</Label>
              <Input type="number" min={0} placeholder="0" value={filters.banheirosMin} onChange={e => updateFilter('banheirosMin', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vagas mín</Label>
              <Input type="number" min={0} placeholder="0" value={filters.vagasMin} onChange={e => updateFilter('vagasMin', e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Portaria</Label>
              <select value={filters.portaria} onChange={e => updateFilter('portaria', e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm">
                <option value="">Todas</option>
                {PORTARIA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Leisure */}
          <div className="space-y-1">
            <Label className="text-xs">Lazer</Label>
            <div className="flex flex-wrap gap-1.5">
              {LAZER_OPTIONS.map(item => {
                const isSelected = filters.lazer.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      updateFilter('lazer', isSelected ? filters.lazer.filter(l => l !== item) : [...filters.lazer, item]);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
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

          {/* Active filters summary */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {filters.endereco && <Badge variant="secondary" className="text-[10px]">Rua: {filters.endereco}</Badge>}
              {filters.bairro && <Badge variant="secondary" className="text-[10px]">Bairro: {filters.bairro}</Badge>}
              {filters.cidade && <Badge variant="secondary" className="text-[10px]">Cidade: {filters.cidade}</Badge>}
              {filters.tipo && <Badge variant="secondary" className="text-[10px]">Tipo: {PROPERTY_TYPE_OPTIONS_DEAL.find(o => o.value === filters.tipo)?.label}</Badge>}
              {filters.quartosMin && <Badge variant="secondary" className="text-[10px]">Quartos ≥ {filters.quartosMin}</Badge>}
              {filters.suitesMin && <Badge variant="secondary" className="text-[10px]">Suítes ≥ {filters.suitesMin}</Badge>}
              {filters.banheirosMin && <Badge variant="secondary" className="text-[10px]">Banheiros ≥ {filters.banheirosMin}</Badge>}
              {filters.vagasMin && <Badge variant="secondary" className="text-[10px]">Vagas ≥ {filters.vagasMin}</Badge>}
              {filters.valorMin && <Badge variant="secondary" className="text-[10px]">Valor ≥ {formatCurrency(Number(filters.valorMin))}</Badge>}
              {filters.valorMax && <Badge variant="secondary" className="text-[10px]">Valor ≤ {formatCurrency(Number(filters.valorMax))}</Badge>}
              {filters.metragensMin && <Badge variant="secondary" className="text-[10px]">Área ≥ {filters.metragensMin}m²</Badge>}
              {filters.portaria && <Badge variant="secondary" className="text-[10px]">{PORTARIA_LABELS[filters.portaria]}</Badge>}
              {filters.lazer.map(l => <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>)}
            </div>
          )}
        </div>
      )}

      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusFilters.map((sf) => {
          const isActive = statusFilter === sf.value;
          const count = deals.filter(d => d.status === sf.value).length;
          return (
            <button
              key={sf.value}
              onClick={() => setStatusFilter(sf.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                isActive ? sf.activeClass : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              )}
            >
              {sf.label}
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-xs',
                isActive ? 'bg-white/20' : 'bg-muted'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">{filteredDeals.length} imóve{filteredDeals.length !== 1 ? 'is' : 'l'}</p>

      {/* Cards Grid */}
      {filteredDeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">Nenhum imóvel encontrado</p>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealSelect(deal)} compatibleCount={compatibleCountMap[deal.id] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}
