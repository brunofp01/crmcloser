import React, { useState, useMemo, FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search, Loader2, MapPin, Bed, Car, Maximize, ExternalLink,
  Globe, SlidersHorizontal, X, ChevronDown, ChevronUp, AlertCircle,
  Building2, RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZapListing {
  id: number;
  titulo: string | null;
  valor: number | null;
  metragem: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  suites: number | null;
  tipo: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  url: string | null;
  imagem_url: string | null;
}

interface SearchParams {
  estado: string;
  cidade: string;
  bairro: string;
}

interface Filters {
  quartosMin: string;
  valorMin: string;
  valorMax: string;
  metragensMin: string;
  tipo: string;
}

const emptyFilters: Filters = {
  quartosMin: '',
  valorMin: '',
  valorMax: '',
  metragensMin: '',
  tipo: '',
};

const TIPO_OPTIONS = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'kitnet', label: 'Kitnet' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala comercial', label: 'Sala Comercial' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number | null) => {
  if (!value) return 'A definir';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

// ─── Card ─────────────────────────────────────────────────────────────────────

function AnuncioCard({ listing }: { listing: ZapListing }) {
  const photo = listing.imagem_url || '/placeholder.svg';

  return (
    <div className="card-elevated overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={photo}
          alt={listing.titulo || 'Imóvel'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        {listing.tipo && (
          <Badge className="absolute top-2 left-2 bg-sidebar text-sidebar-foreground border-0 text-[10px] capitalize">
            {listing.tipo}
          </Badge>
        )}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
            <img
              src="https://www.zapimoveis.com.br/favicon.ico"
              alt="Zap"
              className="w-3 h-3 rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-white text-[9px] font-medium">Zap Imóveis</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug group-hover:text-accent transition-colors">
          {listing.titulo || 'Sem título'}
        </h3>

        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {[listing.bairro, listing.cidade, listing.estado].filter(Boolean).join(', ') || listing.endereco || 'Local não informado'}
          </span>
        </div>

        <p className="text-base font-bold text-accent">
          {formatCurrency(listing.valor)}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          {listing.quartos != null && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{listing.quartos}</span>
            </div>
          )}
          {listing.vagas != null && (
            <div className="flex items-center gap-1">
              <Car className="w-4 h-4" />
              <span>{listing.vagas}</span>
            </div>
          )}
          {listing.metragem != null && (
            <div className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              <span>{listing.metragem}m²</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-2 border-t border-border">
          {listing.url ? (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium gradient-gold text-white hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver no Zap Imóveis
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Link não disponível</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AnunciosPage() {
  const [searchParams, setSearchParams] = useState<SearchParams>({ estado: 'mg', cidade: 'belo-horizonte', bairro: '' });
  const [listings, setListings] = useState<ZapListing[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [zapUrl, setZapUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '' && !(Array.isArray(v) && v.length === 0)).length;
  }, [filters]);

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!searchParams.estado || !searchParams.cidade || !searchParams.bairro) return;

    setIsLoading(true);
    setError(null);
    setListings([]);
    setHasSearched(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-zap', {
        body: {
          estado: searchParams.estado,
          cidade: searchParams.cidade,
          bairro: searchParams.bairro,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao buscar anúncios');

      setListings(data.data.listings || []);
      setTotal(data.data.total ?? null);
      setZapUrl(data.data.url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const q = searchQuery.toLowerCase();
      if (q) {
        const matches =
          l.titulo?.toLowerCase().includes(q) ||
          l.bairro?.toLowerCase().includes(q) ||
          l.cidade?.toLowerCase().includes(q) ||
          l.endereco?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters.quartosMin && (l.quartos == null || l.quartos < Number(filters.quartosMin))) return false;
      if (filters.valorMin && (l.valor == null || l.valor < Number(filters.valorMin))) return false;
      if (filters.valorMax && (l.valor == null || l.valor > Number(filters.valorMax))) return false;
      if (filters.metragensMin && (l.metragem == null || l.metragem < Number(filters.metragensMin))) return false;
      if (filters.tipo && l.tipo?.toLowerCase() !== filters.tipo.toLowerCase()) return false;
      return true;
    });
  }, [listings, searchQuery, filters]);

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Search Form ── */}
      <div className="card-elevated p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Buscar Anúncios no Zap Imóveis</h2>
            <p className="text-xs text-muted-foreground">Informe o Estado, Cidade e Bairro para pesquisar</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Estado (UF)</Label>
            <Input
              placeholder="Ex: mg"
              value={searchParams.estado}
              onChange={e => setSearchParams(p => ({ ...p, estado: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cidade</Label>
            <Input
              placeholder="Ex: belo-horizonte"
              value={searchParams.cidade}
              onChange={e => setSearchParams(p => ({ ...p, cidade: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bairro</Label>
            <Input
              placeholder="Ex: lourdes"
              value={searchParams.bairro}
              onChange={e => setSearchParams(p => ({ ...p, bairro: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            {zapUrl && (
              <a
                href={zapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver no Zap
              </a>
            )}
            <Button
              type="submit"
              disabled={isLoading || !searchParams.estado || !searchParams.cidade || !searchParams.bairro}
              className="gradient-gold text-white gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
              ) : (
                <><Search className="w-4 h-4" /> Buscar Anúncios</>
              )}
            </Button>
          </div>
        </form>

        {/* URL hint */}
        {(searchParams.estado && searchParams.cidade && searchParams.bairro) && (
          <p className="text-[10px] text-muted-foreground font-mono bg-secondary/50 rounded px-2 py-1 break-all">
            zapimoveis.com.br/venda/imoveis/{searchParams.estado}+{searchParams.cidade}++{searchParams.bairro}/
          </p>
        )}
      </div>

      {/* ── Results area ── */}
      {hasSearched && (
        <>
          {/* Toolbar */}
          {!isLoading && !error && listings.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar resultados..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card"
                />
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSearch()}
                className="gap-1.5"
                title="Atualizar resultados"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Filters panel */}
          {showFilters && (
            <div className="card-elevated p-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Filtros</h3>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground gap-1">
                    <X className="w-3 h-3" /> Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={filters.tipo}
                    onChange={e => updateFilter('tipo', e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                  >
                    <option value="">Todos</option>
                    {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quartos mín</Label>
                  <Input type="number" min={0} placeholder="0" value={filters.quartosMin} onChange={e => updateFilter('quartosMin', e.target.value)} className="h-9 text-sm" />
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

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                  {filters.tipo && <Badge variant="secondary" className="text-[10px]">Tipo: {filters.tipo}</Badge>}
                  {filters.quartosMin && <Badge variant="secondary" className="text-[10px]">Quartos ≥ {filters.quartosMin}</Badge>}
                  {filters.valorMin && <Badge variant="secondary" className="text-[10px]">Valor ≥ {formatCurrency(Number(filters.valorMin))}</Badge>}
                  {filters.valorMax && <Badge variant="secondary" className="text-[10px]">Valor ≤ {formatCurrency(Number(filters.valorMax))}</Badge>}
                  {filters.metragensMin && <Badge variant="secondary" className="text-[10px]">Área ≥ {filters.metragensMin}m²</Badge>}
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">Buscando anúncios no Zap Imóveis...</p>
                <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
              </div>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Falha ao buscar anúncios</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSearch()} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </Button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && listings.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <Building2 className="w-12 h-12 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-foreground">Nenhum anúncio encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">Tente outro bairro ou cidade</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && listings.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredListings.length} anúncio{filteredListings.length !== 1 ? 's' : ''}
                  {total != null && listings.length < total && (
                    <span className="text-xs ml-1">(de {total.toLocaleString('pt-BR')} no total)</span>
                  )}
                </p>
                {zapUrl && (
                  <a
                    href={zapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    Ver todos no Zap <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-muted-foreground text-sm">Nenhum resultado para esses filtros</p>
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">Limpar filtros</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredListings.map(listing => (
                    <AnuncioCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Initial state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Pesquise imóveis no Zap Imóveis</p>
            <p className="text-xs text-muted-foreground mt-1">
              Preencha o Estado, Cidade e Bairro acima e clique em Buscar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
