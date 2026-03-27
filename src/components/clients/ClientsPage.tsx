import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { STAGE_LABELS, ClientStage, STAGES_ORDER } from '@/types/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientsWithBroker, ClientWithBroker } from '@/hooks/useClientsWithBroker';
import { useDeals } from '@/hooks/useDeals';
import {
  Search, Loader2, MapPin, DollarSign, BedDouble, Car, Maximize2, Home, Link2, Filter, X,
} from 'lucide-react';

const stageColors: Record<ClientStage, { bg: string; text: string; activeBg: string }> = {
  lead: { bg: 'bg-blue-100', text: 'text-blue-700', activeBg: 'bg-blue-500' },
  qualification: { bg: 'bg-indigo-100', text: 'text-indigo-700', activeBg: 'bg-indigo-500' },
  contact: { bg: 'bg-purple-100', text: 'text-purple-700', activeBg: 'bg-purple-500' },
  negotiation: { bg: 'bg-orange-100', text: 'text-orange-700', activeBg: 'bg-orange-500' },
  visit: { bg: 'bg-amber-100', text: 'text-amber-700', activeBg: 'bg-amber-500' },
  proposal: { bg: 'bg-cyan-100', text: 'text-cyan-700', activeBg: 'bg-cyan-500' },
  closed: { bg: 'bg-emerald-100', text: 'text-emerald-700', activeBg: 'bg-emerald-500' },
  quarantine: { bg: 'bg-gray-100', text: 'text-gray-700', activeBg: 'bg-gray-500' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', activeBg: 'bg-red-500' },
};

interface ClientsPageProps {
  onClientSelect: (client: ClientWithBroker) => void;
}

function formatCurrency(value: number | null | undefined) {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export function ClientsPage({ onClientSelect }: ClientsPageProps) {
  const { data: clients = [], isLoading } = useClientsWithBroker();
  const { data: deals = [] } = useDeals();
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stageFilter, setStageFilter] = useState<ClientStage | 'all'>(() => {
    const param = searchParams.get('stage');
    if (param && STAGES_ORDER.includes(param as ClientStage)) return param as ClientStage;
    return 'all';
  });

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterBairro, setFilterBairro] = useState('');
  const [filterBudgetMin, setFilterBudgetMin] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState('');
  const [filterAreaMin, setFilterAreaMin] = useState('');
  const [filterBedroomsMin, setFilterBedroomsMin] = useState('');
  const [filterParkingMin, setFilterParkingMin] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterBairro) count++;
    if (filterBudgetMin) count++;
    if (filterBudgetMax) count++;
    if (filterAreaMin) count++;
    if (filterBedroomsMin) count++;
    if (filterParkingMin) count++;
    if (filterSource) count++;
    return count;
  }, [filterBairro, filterBudgetMin, filterBudgetMax, filterAreaMin, filterBedroomsMin, filterParkingMin, filterSource]);

  const clearAdvancedFilters = () => {
    setFilterBairro('');
    setFilterBudgetMin('');
    setFilterBudgetMax('');
    setFilterAreaMin('');
    setFilterBedroomsMin('');
    setFilterParkingMin('');
    setFilterSource('');
  };

  useEffect(() => {
    const param = searchParams.get('stage');
    if (param && STAGES_ORDER.includes(param as ClientStage)) {
      setStageFilter(param as ClientStage);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Count linked deals per client
  const linkedDealsMap = useMemo(() => {
    const map: Record<string, number> = {};
    deals.forEach(deal => {
      (deal.deal_clients || []).forEach(dc => {
        map[dc.client_id] = (map[dc.client_id] || 0) + 1;
      });
    });
    return map;
  }, [deals]);

  // Count compatible deals per client (score >= 100)
  const compatibleDealsMap = useMemo(() => {
    const activeDeals = deals.filter(d => d.status === 'active');
    const map: Record<string, number> = {};
    
    clients.forEach(client => {
      let count = 0;
      activeDeals.forEach(deal => {
        let score = 50;
        if (deal.valor && client.budget_max) {
          if (deal.valor <= client.budget_max) score += 15;
          else if (deal.valor <= client.budget_max * 1.1) score += 8;
          else score -= 15;
        }
        if (deal.valor && client.budget_min && deal.valor < client.budget_min) score -= 10;
        if (deal.quartos && client.bedrooms_min) {
          score += deal.quartos >= client.bedrooms_min ? 10 : -10;
        }
        if (deal.vagas && client.parking_min) {
          score += deal.vagas >= client.parking_min ? 5 : -5;
        }
        if (deal.metragem && client.area_min) {
          if (deal.metragem >= client.area_min) score += 10;
          else if (deal.metragem >= client.area_min * 0.9) score += 5;
          else score -= 10;
        }
        if (deal.bairro && client.preferred_region) {
          const db = deal.bairro.toLowerCase();
          const cr = client.preferred_region.toLowerCase();
          if (cr.includes(db) || db.includes(cr.split(',')[0]?.trim())) score += 10;
        }
        if (deal.tipo && client.property_types?.length) {
          const dt = deal.tipo.toLowerCase();
          if (client.property_types.some(t => dt.includes(t) || t.includes(dt))) score += 5;
        }
        if (Math.max(0, Math.min(100, score)) >= 100) count++;
      });
      map[client.id] = count;
    });
    return map;
  }, [deals, clients]);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: clients.length };
    STAGES_ORDER.forEach(s => { counts[s] = 0; });
    clients.forEach(c => { counts[c.stage] = (counts[c.stage] || 0) + 1; });
    return counts;
  }, [clients]);

  const filteredClients = useMemo(() => {
    const budgetMinNum = filterBudgetMin ? Number(filterBudgetMin) : null;
    const budgetMaxNum = filterBudgetMax ? Number(filterBudgetMax) : null;
    const areaMinNum = filterAreaMin ? Number(filterAreaMin) : null;
    const bedroomsMinNum = filterBedroomsMin ? Number(filterBedroomsMin) : null;
    const parkingMinNum = filterParkingMin ? Number(filterParkingMin) : null;
    const bairroLower = filterBairro.toLowerCase().trim();

    const filtered = clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        client.phone.includes(searchQuery);
      const matchesStage = stageFilter === 'all' || client.stage === stageFilter;

      // Advanced filters
      const matchesBairro = !bairroLower || (client.preferred_region?.toLowerCase().includes(bairroLower) ?? false);
      const matchesBudgetMin = !budgetMinNum || (client.budget_max != null && client.budget_max >= budgetMinNum);
      const matchesBudgetMax = !budgetMaxNum || (client.budget_max != null && client.budget_max <= budgetMaxNum);
      const matchesArea = !areaMinNum || (client.area_min != null && client.area_min >= areaMinNum);
      const matchesBedrooms = !bedroomsMinNum || (client.bedrooms_min != null && client.bedrooms_min >= bedroomsMinNum);
      const matchesParking = !parkingMinNum || (client.parking_min != null && client.parking_min >= parkingMinNum);
      const matchesSource = !filterSource || (client.source === filterSource);

      return matchesSearch && matchesStage && matchesBairro && matchesBudgetMin && matchesBudgetMax && matchesArea && matchesBedrooms && matchesParking && matchesSource;
    });
    const DISPLAY_ORDER: ClientStage[] = ['proposal', 'negotiation', 'visit', 'lead', 'qualification', 'contact', 'closed', 'quarantine', 'lost'];
    return filtered.sort((a, b) => {
      const indexA = DISPLAY_ORDER.indexOf(a.stage);
      const indexB = DISPLAY_ORDER.indexOf(b.stage);
      return indexA - indexB;
    });
  }, [clients, searchQuery, stageFilter, filterBairro, filterBudgetMin, filterBudgetMax, filterAreaMin, filterBedroomsMin, filterParkingMin, filterSource]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2">
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
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'relative p-2.5 rounded-lg border border-border transition-colors',
            showAdvanced || activeFilterCount > 0
              ? 'bg-accent/10 border-accent text-accent'
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Filter className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="card-elevated p-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtros avançados</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAdvancedFilters} className="text-xs text-accent hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Bairro
              </label>
              <Input
                placeholder="Ex: Copacabana"
                value={filterBairro}
                onChange={(e) => setFilterBairro(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Valor mín.
              </label>
              <Input
                type="number"
                placeholder="Ex: 200000"
                value={filterBudgetMin}
                onChange={(e) => setFilterBudgetMin(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Valor máx.
              </label>
              <Input
                type="number"
                placeholder="Ex: 500000"
                value={filterBudgetMax}
                onChange={(e) => setFilterBudgetMax(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Metragem mín.
              </label>
              <Input
                type="number"
                placeholder="Ex: 60"
                value={filterAreaMin}
                onChange={(e) => setFilterAreaMin(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <BedDouble className="w-3 h-3" /> Quartos mín.
              </label>
              <Input
                type="number"
                placeholder="Ex: 2"
                value={filterBedroomsMin}
                onChange={(e) => setFilterBedroomsMin(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <Car className="w-3 h-3" /> Vagas mín.
              </label>
              <Input
                type="number"
                placeholder="Ex: 1"
                value={filterParkingMin}
                onChange={(e) => setFilterParkingMin(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setStageFilter('all')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
            stageFilter === 'all'
              ? 'bg-accent text-white border-accent'
              : 'bg-card border-border text-muted-foreground hover:bg-secondary'
          )}
        >
          Todos
          <span className={cn(
            'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
            stageFilter === 'all' ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
          )}>
            {stageCounts.all}
          </span>
        </button>
        {STAGES_ORDER.map((stage) => {
          const colors = stageColors[stage];
          const isActive = stageFilter === stage;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                isActive
                  ? `${colors.activeBg} text-white border-transparent`
                  : `${colors.bg} ${colors.text} border-transparent hover:opacity-80`
              )}
            >
              {STAGE_LABELS[stage]}
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-white/60'
              )}>
                {stageCounts[stage] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
      </p>

      {/* Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">Nenhum cliente encontrado</p>
          <p className="text-sm text-muted-foreground">Cadastre seu primeiro cliente clicando em "Novo Cliente"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredClients.map((client) => {
            const colors = stageColors[client.stage];
            const linked = linkedDealsMap[client.id] || 0;
            const compatible = compatibleDealsMap[client.id] || 0;

            return (
              <div
                key={client.id}
                onClick={() => onClientSelect(client)}
                className="card-elevated p-4 cursor-pointer hover:shadow-prominent transition-all animate-scale-in space-y-3"
              >
                {/* Name + Stage */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{client.name}</h4>
                    {client.is_investidor && (
                      <Badge className="mt-1 bg-emerald-700 text-white hover:bg-emerald-800 text-[10px]">Investidor</Badge>
                    )}
                  </div>
                  <Badge className={cn('text-[10px] shrink-0 border-0', colors.bg, colors.text)}>
                    {STAGE_LABELS[client.stage]}
                  </Badge>
                </div>

                {/* Client preferences */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {client.preferred_region && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{client.preferred_region}</span>
                    </div>
                  )}
                  {client.budget_max && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-foreground">{formatCurrency(client.budget_max)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {client.area_min && (
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" />{client.area_min}m²
                      </span>
                    )}
                    {client.bedrooms_min && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />{client.bedrooms_min}
                      </span>
                    )}
                    {client.parking_min && (
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3" />{client.parking_min}
                      </span>
                    )}
                  </div>
                </div>

                {/* Deals stats */}
                <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-1" title="Imóveis compatíveis">
                    <Home className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium">{compatible}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Imóveis vinculados">
                    <Link2 className="w-3.5 h-3.5 text-accent" />
                    <span className="font-medium">{linked}</span>
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
