import { Lancamento } from '@/hooks/useLancamentos';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, MapPin, ArrowUpDown, CreditCard, Check, Sparkles,
} from 'lucide-react';

interface Props {
  lancamento: Lancamento;
}

const formatCurrency = (value: number | null) => {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

export function LancamentoOverview({ lancamento: l }: Props) {
  return (
    <div className="space-y-4">
      {/* Price Section */}
      {(l.valor_min || l.valor_max) && (
        <div className="card-elevated p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Investimento</h3>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            {l.valor_min && (
              <span className="text-xl font-bold text-accent">{formatCurrency(l.valor_min)}</span>
            )}
            {l.valor_min && l.valor_max && (
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {l.valor_max && (
              <span className="text-xl font-bold text-accent">{formatCurrency(l.valor_max)}</span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            {l.comissao_percentual > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/5">
                <CreditCard className="w-3 h-3 text-accent" />
                Comissão: <strong className="text-foreground">{l.comissao_percentual}%</strong>
              </span>
            )}
            {l.forma_pagamento && l.forma_pagamento.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {l.forma_pagamento.map((fp, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal">{fp}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Address */}
      <div className="card-elevated p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Localização</h3>
        </div>
        <div className="space-y-0.5 text-sm text-muted-foreground">
          {l.endereco && (
            <p>{l.endereco}{l.numero && `, ${l.numero}`}</p>
          )}
          <p className="font-medium text-foreground">
            {[l.bairro, l.cidade, l.estado].filter(Boolean).join(' · ')}
          </p>
          {l.cep && <p className="text-xs">CEP: {l.cep}</p>}
        </div>
      </div>

      {/* Description */}
      {l.descricao && (
        <div className="card-elevated p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Sobre o Empreendimento</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{l.descricao}</p>
        </div>
      )}

      {/* Leisure */}
      {l.area_lazer && l.area_lazer.length > 0 && (
        <div className="card-elevated p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Área de Lazer</h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
              {l.area_lazer.length} itens
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {l.area_lazer.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[11px] font-normal px-2.5 py-1">{String(item)}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Differentials */}
      {l.diferenciais && l.diferenciais.length > 0 && (
        <div className="card-elevated p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Diferenciais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {l.diferenciais.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span>{String(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {l.observacoes && (
        <div className="card-elevated p-4 space-y-2 border-l-2 border-accent/30">
          <h3 className="text-sm font-semibold text-foreground">Observações Internas</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{l.observacoes}</p>
        </div>
      )}
    </div>
  );
}
