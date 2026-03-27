import { useState } from 'react';
import { useProperties, Property } from '@/hooks/useProperties';
import { PropertyCard } from './PropertyCard';
import { PropertyDetail } from './PropertyDetail';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Building, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

export function PropertiesPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState({
    tipo: '',
    bairro: '',
    minQuartos: '',
    source: '',
  });

  const { data: properties, isLoading } = useProperties({
    search: search || undefined,
    tipo: filters.tipo || undefined,
    bairro: filters.bairro || undefined,
    minQuartos: filters.minQuartos ? parseInt(filters.minQuartos) : undefined,
    source: filters.source || undefined,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const clearFilters = () => {
    setFilters({ tipo: '', bairro: '', minQuartos: '', source: '' });
    setSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || search;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      {isMobile && (
        <div className="flex items-center gap-2">
          <Building className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Imóveis</h1>
            <p className="text-sm text-muted-foreground">
              {properties?.length || 0} imóveis disponíveis
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, bairro ou cidade..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Tipo de Imóvel</Label>
                <Select value={filters.tipo} onValueChange={(v) => setFilters(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Casa">Casa</SelectItem>
                    <SelectItem value="Cobertura">Cobertura</SelectItem>
                    <SelectItem value="Sala Comercial">Sala Comercial</SelectItem>
                    <SelectItem value="Loja">Loja</SelectItem>
                    <SelectItem value="Terreno">Terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quartos (mínimo)</Label>
                <Select value={filters.minQuartos} onValueChange={(v) => setFilters(f => ({ ...f, minQuartos: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  placeholder="Ex: Savassi, Lourdes..."
                  value={filters.bairro}
                  onChange={(e) => setFilters(f => ({ ...f, bairro: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Fonte</Label>
                <Select value={filters.source} onValueChange={(v) => setFilters(f => ({ ...f, source: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as fontes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as fontes</SelectItem>
                    <SelectItem value="privus">Privus</SelectItem>
                    <SelectItem value="blow">Blow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" className="w-full" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => setSelectedProperty(property)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-foreground">Nenhum imóvel encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou a busca
          </p>
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
