import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/hooks/useProperties';
import { MapPin, Bed, Car, Maximize, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const formatCurrency = (value: number | null) => {
    if (!value) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const mainPhoto = property.fotos?.[0] || '/placeholder.svg';

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={mainPhoto}
          alt={property.titulo || 'Imóvel'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {property.destaque && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
            Destaque
          </Badge>
        )}
        {property.source && (
          <Badge 
            variant="secondary" 
            className={cn(
              "absolute top-2 right-2 text-xs",
              property.source === 'blow' && "bg-blue-500/90 text-white"
            )}
          >
            {property.source === 'blow' ? 'Blow' : property.source}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
          {property.titulo || 'Sem título'}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">
            {[property.bairro, property.cidade].filter(Boolean).join(', ') || 'Localização não informada'}
          </span>
        </div>
        <p className="text-base font-bold text-accent">
          {formatCurrency(property.valor)}
        </p>
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          {property.quartos && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.quartos}</span>
            </div>
          )}
          {property.vagas && (
            <div className="flex items-center gap-1">
              <Car className="w-4 h-4" />
              <span>{property.vagas}</span>
            </div>
          )}
          {property.area_util && (
            <div className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              <span>{property.area_util}m²</span>
            </div>
          )}
          {property.tipo && (
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              <span className="line-clamp-1">{property.tipo}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
