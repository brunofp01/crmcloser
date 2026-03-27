import { Lancamento } from '@/hooks/useLancamentos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Building, MapPin, Calendar, Globe, PlayCircle, ExternalLink,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  active: 'Em Lançamento',
  pre_launch: 'Pré-Lançamento',
  construction: 'Em Obras',
  delivered: 'Entregue',
  sold_out: 'Esgotado',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/90 text-white',
  pre_launch: 'bg-amber-500/90 text-white',
  construction: 'bg-blue-500/90 text-white',
  delivered: 'bg-muted text-muted-foreground',
  sold_out: 'bg-destructive/90 text-white',
};

interface Props {
  lancamento: Lancamento;
}

export function LancamentoHero({ lancamento: l }: Props) {
  const hasImage = l.fotos && l.fotos.length > 0;

  return (
    <div className="relative">
      {/* Hero image */}
      <div className={cn('w-full bg-muted relative', hasImage ? 'h-56 sm:h-72' : 'h-32')}>
        {hasImage ? (
          <img
            src={l.fotos![0]}
            alt={l.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <Building className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Status badge */}
        <Badge className={cn('absolute top-3 left-3 text-[11px] border-0 font-semibold shadow-lg', STATUS_COLORS[l.status] || STATUS_COLORS.active)}>
          {STATUS_LABELS[l.status] || l.status}
        </Badge>

        {/* Logo */}
        {l.logo_url && (
          <div className="absolute top-3 right-3 w-12 h-12 rounded-xl bg-white/95 shadow-lg p-1.5 backdrop-blur-sm">
            <img src={l.logo_url} alt={l.construtora || ''} className="w-full h-full object-contain" />
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">{l.nome}</h1>
          {l.construtora && (
            <p className="text-xs text-white/80 mt-0.5 font-medium">{l.construtora}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {l.bairro && (
              <span className="flex items-center gap-1 text-[11px] text-white/90">
                <MapPin className="w-3 h-3" />
                {l.bairro}{l.cidade && `, ${l.cidade}`}
              </span>
            )}
            {l.previsao_entrega && (
              <span className="flex items-center gap-1 text-[11px] text-white/90">
                <Calendar className="w-3 h-3" />
                Entrega: {l.previsao_entrega}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action links bar */}
      {(l.website_url || l.video_url) && (
        <div className="flex gap-2 px-4 py-2.5 border-b border-border bg-card">
          {l.website_url && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1 sm:flex-none" asChild>
              <a href={l.website_url} target="_blank" rel="noopener noreferrer">
                <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            </Button>
          )}
          {l.video_url && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1 sm:flex-none" asChild>
              <a href={l.video_url} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="w-3.5 h-3.5" /> Vídeo Tour <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
