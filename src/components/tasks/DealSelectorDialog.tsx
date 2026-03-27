import { useState, useMemo } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Home, MapPin, DollarSign, BedDouble, Car, Maximize2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDealId: string;
  onSelect: (dealId: string) => void;
}

export function DealSelectorDialog({ open, onOpenChange, selectedDealId, onSelect }: DealSelectorDialogProps) {
  const { data: deals = [] } = useDeals();
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      if (d.status !== 'active') return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return d.title?.toLowerCase().includes(q) ||
        d.bairro?.toLowerCase().includes(q) ||
        d.cidade?.toLowerCase().includes(q) ||
        d.endereco?.toLowerCase().includes(q) ||
        (d as any).codigo_imovel?.toLowerCase().includes(q);
    });
  }, [deals, searchQuery]);

  const handleSelect = (dealId: string) => {
    onSelect(dealId === selectedDealId ? '' : dealId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSearchQuery(''); }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Selecionar Imóvel</DialogTitle>
        </DialogHeader>

        <div className="px-4 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar imóvel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">{filteredDeals.length} imóve{filteredDeals.length !== 1 ? 'is' : 'l'}</p>
            {selectedDealId && (
              <Button variant="ghost" size="sm" onClick={() => { onSelect(''); onOpenChange(false); }} className="h-5 text-[10px] text-muted-foreground gap-1 px-1">
                <X className="w-2.5 h-2.5" /> Remover seleção
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {filteredDeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum imóvel encontrado.</p>
              </div>
            ) : (
              filteredDeals.map((deal) => {
                const isSelected = deal.id === selectedDealId;
                return (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => handleSelect(deal.id)}
                    className={cn(
                      'w-full flex gap-3 p-2.5 rounded-lg border transition-colors text-left',
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-border hover:bg-secondary/30'
                    )}
                  >
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
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                        {deal.bairro || 'Local não informado'}{deal.cidade && `, ${deal.cidade}`}
                      </p>
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
                    {isSelected && (
                      <div className="self-center shrink-0">
                        <Check className="w-5 h-5 text-accent" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
