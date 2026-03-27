import { useState } from 'react';
import { MatchedDeal } from '@/hooks/useDealMatches';
import { DealWithClients } from '@/types/deal';
import { useLinkClientToDeal } from '@/hooks/useDeals';
import { useCreateInteraction } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
  ExternalLink, BedDouble, Car, Maximize2, DollarSign, MapPin,
  Loader2, Sparkles, Home, RefreshCw, Link2, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface DealMatchesProps {
  clientId: string;
  matches: MatchedDeal[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh: () => void;
  onDealSelect?: (deal: DealWithClients) => void;
}

export function DealMatches({ clientId, matches, isLoading, isRefreshing = false, onRefresh, onDealSelect }: DealMatchesProps) {
  const linkClient = useLinkClientToDeal();
  const createInteraction = useCreateInteraction();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // Discard popup state
  const [discardPopup, setDiscardPopup] = useState(false);
  const [discardNotes, setDiscardNotes] = useState('');
  const [pendingDiscard, setPendingDiscard] = useState<MatchedDeal | null>(null);
  const [dismissing, setDismissing] = useState(false);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

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

  const handleDiscardClick = (deal: MatchedDeal) => {
    setPendingDiscard(deal);
    setDiscardNotes('');
    setDiscardPopup(true);
  };

  const confirmDiscard = async () => {
    if (!pendingDiscard || !user) return;
    setDismissing(true);
    try {
      // Insert into dismissed_matches
      const { error } = await supabase.from('dismissed_matches').insert({
        client_id: clientId,
        deal_id: pendingDiscard.id,
        reason: discardNotes || null,
        dismissed_by: user.id,
      });
      if (error) throw error;

      // Log to client interactions
      await createInteraction.mutateAsync({
        client_id: clientId,
        type: 'stage_change' as const,
        notes: `Imóvel "${pendingDiscard.title || 'Sem título'}" descartado das sugestões${discardNotes ? ` — Motivo: ${discardNotes}` : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: ['dismissed-matches', clientId] });
      onRefresh();
      toast.success('Imóvel descartado das sugestões.');
    } catch (err: any) {
      toast.error('Erro ao descartar: ' + err.message);
    } finally {
      setDismissing(false);
      setDiscardPopup(false);
      setPendingDiscard(null);
      setDiscardNotes('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Analisando negócios...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum negócio compatível encontrado.</p>
        <p className="text-xs text-muted-foreground mt-1">Cadastre negócios ou complete o perfil do cliente.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">{matches.length} negócio{matches.length !== 1 ? 's' : ''} compatíve{matches.length !== 1 ? 'is' : 'l'}</p>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />Atualizar
        </Button>
      </div>

      <ScrollArea className={cn("pr-2", matches.length <= 1 ? "h-auto" : matches.length <= 3 ? "h-[240px]" : "h-[360px]")}>
        <div className="space-y-3">
          {matches.map((deal) => (
            <Card key={deal.id} className={cn("overflow-hidden transition-all", onDealSelect && "cursor-pointer hover:ring-1 hover:ring-accent/30")}
              onClick={() => onDealSelect && onDealSelect(deal as unknown as DealWithClients)}>

              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {deal.listing_image_url ? (
                      <img src={deal.listing_image_url} alt={deal.title || 'Negócio'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm line-clamp-1 text-foreground">{deal.title || 'Negócio sem título'}</h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">{deal.matchScore}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{deal.bairro || 'Local não informado'}{deal.cidade && `, ${deal.cidade}`}</span>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-semibold text-accent">
                      <DollarSign className="h-3.5 w-3.5" />{formatCurrency(deal.valor)}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {deal.quartos && <span className="flex items-center gap-0.5"><BedDouble className="h-3 w-3" />{deal.quartos}</span>}
                      {deal.vagas && <span className="flex items-center gap-0.5"><Car className="h-3 w-3" />{deal.vagas}</span>}
                      {deal.metragem && <span className="flex items-center gap-0.5"><Maximize2 className="h-3 w-3" />{deal.metragem}m²</span>}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {deal.matchReasons.map((reason, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">{reason}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDiscardClick(deal)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />Descartar
                  </Button>
                  <div className="flex-1" />
                  {deal.listing_url && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(deal.listing_url!, '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />Ver
                    </Button>
                  )}
                  <Button size="sm" className="h-7 text-xs" onClick={() => handleLink(deal.id)} disabled={linkingId === deal.id}>
                    {linkingId === deal.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                    Vincular
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Discard Justification Popup */}
      <AlertDialog open={discardPopup} onOpenChange={setDiscardPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar imóvel sugerido</AlertDialogTitle>
            <AlertDialogDescription>
              Descreva o motivo para descartar "{pendingDiscard?.title || 'Sem título'}" das sugestões deste cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Descreva o motivo..."
            value={discardNotes}
            onChange={(e) => setDiscardNotes(e.target.value)}
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDiscardPopup(false); setPendingDiscard(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} disabled={dismissing}>
              {dismissing && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
