import { useState, useMemo } from 'react';
import { useLancamentos, Lancamento } from '@/hooks/useLancamentos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Loader2, Building, MapPin, DollarSign, BedDouble, Car, Maximize2, Calendar,
} from 'lucide-react';

interface LancamentosPageProps {
  onSelect: (lancamento: Lancamento) => void;
  onNew: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Em Lançamento',
  pre_launch: 'Pré-Lançamento',
  construction: 'Em Obras',
  delivered: 'Entregue',
  sold_out: 'Esgotado',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pre_launch: 'bg-amber-100 text-amber-700',
  construction: 'bg-blue-100 text-blue-700',
  delivered: 'bg-secondary text-muted-foreground',
  sold_out: 'bg-destructive/10 text-destructive',
};

export function LancamentosPage({ onSelect, onNew }: LancamentosPageProps) {
  const { data: lancamentos = [], isLoading } = useLancamentos();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const filtered = useMemo(() => {
    return lancamentos.filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return l.nome.toLowerCase().includes(q) ||
        l.construtora?.toLowerCase().includes(q) ||
        l.bairro?.toLowerCase().includes(q) ||
        l.cidade?.toLowerCase().includes(q);
    });
  }, [lancamentos, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: lancamentos.length };
    lancamentos.forEach(l => { c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [lancamentos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lançamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button onClick={onNew} className="gradient-gold text-white gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pre_launch', label: 'Pré-Lançamento' },
          { key: 'active', label: 'Em Lançamento' },
          { key: 'construction', label: 'Em Obras' },
          { key: 'delivered', label: 'Entregue' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
              statusFilter === key
                ? 'bg-accent text-white border-accent'
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            )}
          >
            {label}
            {counts[key] !== undefined && (
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                statusFilter === key ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
              )}>
                {counts[key] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Building className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-2">Nenhum lançamento encontrado</p>
          <p className="text-sm text-muted-foreground">Cadastre seu primeiro empreendimento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => (
            <button
              key={l.id}
              onClick={() => onSelect(l)}
              className="card-elevated p-0 overflow-hidden text-left transition-all hover:ring-1 hover:ring-accent/30 animate-scale-in"
            >
              {/* Image */}
              <div className="w-full h-40 bg-muted relative">
                {l.fotos && l.fotos.length > 0 ? (
                  <img src={l.fotos[0]} alt={l.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <Badge className={cn('absolute top-2 left-2 text-[10px] border-0', STATUS_COLORS[l.status] || STATUS_COLORS.active)}>
                  {STATUS_LABELS[l.status] || l.status}
                </Badge>
                {l.logo_url && (
                  <div className="absolute bottom-2 right-2 w-10 h-10 rounded-lg bg-white/90 p-1">
                    <img src={l.logo_url} alt={l.construtora || ''} className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <div>
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">{l.nome}</h3>
                  {l.construtora && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{l.construtora}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{l.bairro || 'Local não informado'}{l.cidade && `, ${l.cidade}`}</span>
                </div>

                {/* Price range */}
                {(l.valor_min || l.valor_max) && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-accent">
                    <DollarSign className="w-3 h-3" />
                    {l.valor_min && l.valor_max ? (
                      <span>{formatCurrency(l.valor_min)} - {formatCurrency(l.valor_max)}</span>
                    ) : (
                      <span>A partir de {formatCurrency(l.valor_min || l.valor_max)}</span>
                    )}
                  </div>
                )}

                {/* Specs */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {(l.quartos_min || l.quartos_max) && (
                    <span className="flex items-center gap-0.5">
                      <BedDouble className="w-2.5 h-2.5" />
                      {l.quartos_min === l.quartos_max ? l.quartos_min : `${l.quartos_min || '?'}-${l.quartos_max || '?'}`}
                    </span>
                  )}
                  {(l.vagas_min || l.vagas_max) && (
                    <span className="flex items-center gap-0.5">
                      <Car className="w-2.5 h-2.5" />
                      {l.vagas_min === l.vagas_max ? l.vagas_min : `${l.vagas_min || '?'}-${l.vagas_max || '?'}`}
                    </span>
                  )}
                  {(l.area_min || l.area_max) && (
                    <span className="flex items-center gap-0.5">
                      <Maximize2 className="w-2.5 h-2.5" />
                      {l.area_min === l.area_max ? `${l.area_min}m²` : `${l.area_min || '?'}-${l.area_max || '?'}m²`}
                    </span>
                  )}
                  {l.previsao_entrega && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {l.previsao_entrega}
                    </span>
                  )}
                </div>

                {l.total_unidades && (
                  <p className="text-[10px] text-muted-foreground">{l.total_unidades} unidades</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
