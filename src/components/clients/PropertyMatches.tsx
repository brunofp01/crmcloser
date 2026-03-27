import { useState } from 'react';
import { MatchedProperty, FilterCriteria } from '@/hooks/usePropertyMatches';
import { useCreateInteraction } from '@/hooks/useClients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ExternalLink, 
  MessageSquare, 
  BedDouble, 
  Car, 
  Maximize2, 
  DollarSign,
  MapPin,
  CheckCircle,
  Loader2,
  Sparkles,
  Home,
  RefreshCw,
  Clock,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertyMatchesProps {
  clientId: string;
  clientPhone: string;
  matches: MatchedProperty[];
  isLoading: boolean;
  onInteractionCreated: () => void;
  onRefresh: () => void;
  dataUpdatedAt: number | undefined;
}

const PROPERTY_BASE_URL = 'https://www.privusimoveis.com.br/imovel';

export function PropertyMatches({ 
  clientId, 
  clientPhone, 
  matches, 
  isLoading,
  onInteractionCreated,
  onRefresh,
  dataUpdatedAt
}: PropertyMatchesProps) {
  const createInteraction = useCreateInteraction();
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPropertyUrl = (slug: string) => `${PROPERTY_BASE_URL}/${slug}`;

  const handleSendWhatsApp = async (property: MatchedProperty) => {
    setSendingSlug(property.slug);
    
    try {
      const propertyUrl = getPropertyUrl(property.slug);
      const title = property.titulo || `Imóvel ${property.codigo}`;
      
      // Create the WhatsApp message
      const message = `Olá! Encontrei um imóvel que pode ser do seu interesse:\n\n` +
        `🏠 *${title}*\n` +
        `📍 ${property.bairro || 'Localização não informada'}${property.cidade ? `, ${property.cidade}` : ''}\n` +
        `💰 ${formatCurrency(property.valor)}\n` +
        (property.quartos ? `🛏️ ${property.quartos} quartos\n` : '') +
        (property.area_util ? `📐 ${property.area_util}m²\n` : '') +
        `\n🔗 Veja mais detalhes: ${propertyUrl}`;

      // Log the interaction
      await createInteraction.mutateAsync({
        client_id: clientId,
        type: 'whatsapp',
        notes: `Imóvel enviado por WhatsApp:\n\n${title}\n${property.bairro || ''}${property.cidade ? `, ${property.cidade}` : ''}\nValor: ${formatCurrency(property.valor)}\n\nLink: ${propertyUrl}`,
      });

      // Open WhatsApp with the message
      const phoneClean = clientPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success('Interação registrada e WhatsApp aberto!');
      onInteractionCreated();
    } catch (error) {
      toast.error('Erro ao registrar envio');
    } finally {
      setSendingSlug(null);
    }
  };

  const getLastUpdatedText = () => {
    if (!dataUpdatedAt) return null;
    return formatDistanceToNow(new Date(dataUpdatedAt), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Analisando imóveis com IA...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum imóvel compatível encontrado.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete as preferências do cliente para melhorar as sugestões.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with refresh button and last updated */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Atualizado {getLastUpdatedText()}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <ScrollArea className="h-[360px] pr-2">
        <div className="space-y-3">
        {matches.map((property) => (
          <Card 
            key={property.id} 
            className={cn(
              "overflow-hidden transition-all",
              property.alreadySent && "opacity-70 border-muted"
            )}
          >
            <CardContent className="p-3">
              <div className="flex gap-3">
                {/* Property Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {property.fotos && property.fotos[0] ? (
                    <img 
                      src={property.fotos[0]} 
                      alt={property.titulo || 'Imóvel'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Title and Match Score */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-1 text-foreground">
                      {property.titulo || `Imóvel ${property.codigo}`}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">
                        {property.matchScore}%
                      </span>
                    </div>
                  </div>


                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {property.bairro || 'Localização não informada'}
                      {property.cidade && `, ${property.cidade}`}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-1 text-sm font-semibold text-accent">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatCurrency(property.valor)}
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {property.quartos && (
                      <span className="flex items-center gap-0.5">
                        <BedDouble className="h-3 w-3" />
                        {property.quartos}
                      </span>
                    )}
                    {property.vagas && (
                      <span className="flex items-center gap-0.5">
                        <Car className="h-3 w-3" />
                        {property.vagas}
                      </span>
                    )}
                    {property.area_util && (
                      <span className="flex items-center gap-0.5">
                        <Maximize2 className="h-3 w-3" />
                        {property.area_util}m²
                      </span>
                    )}
                  </div>

                  {/* Filter Criteria Badges */}
                  {property.filterCriteria && (
                    <div className="flex flex-wrap gap-1">
                      {property.filterCriteria.budgetOk && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 mr-0.5" />
                          Orçamento
                        </Badge>
                      )}
                      {property.filterCriteria.bedroomsOk && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 mr-0.5" />
                          Quartos
                        </Badge>
                      )}
                      {property.filterCriteria.regionOk && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 mr-0.5" />
                          Região
                        </Badge>
                      )}
                      {property.filterCriteria.parkingOk && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 mr-0.5" />
                          Vagas
                        </Badge>
                      )}
                      {property.filterCriteria.areaOk && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 mr-0.5" />
                          Área
                        </Badge>
                      )}
                      {property.filterCriteria.typeOk && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 mr-0.5" />
                          Tipo
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Match Reasons */}
                  <div className="flex flex-wrap gap-1">
                    {property.matchReasons.slice(0, 3).map((reason, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                {property.alreadySent && (
                  <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Já enviado
                  </Badge>
                )}
                
                <div className="flex-1" />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open(getPropertyUrl(property.slug), '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                
                <Button
                  size="sm"
                  className="h-7 text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => handleSendWhatsApp(property)}
                  disabled={sendingSlug === property.slug}
                >
                  {sendingSlug === property.slug ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3 w-3 mr-1" />
                  )}
                  {property.alreadySent ? 'Reenviar' : 'Enviar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </ScrollArea>
    </div>
  );
}