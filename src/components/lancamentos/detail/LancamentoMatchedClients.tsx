import { Lancamento } from '@/hooks/useLancamentos';
import { Badge } from '@/components/ui/badge';
import { Client } from '@/types/client';
import { DollarSign, BedDouble, MapPin, Users, ChevronRight } from 'lucide-react';

interface Props {
  lancamento: Lancamento;
  clients: Client[];
  onClientSelect?: (client: Client) => void;
}

export function LancamentoMatchedClients({ lancamento: l, clients, onClientSelect }: Props) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhum cliente compatível</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          Clientes com critérios de busca compatíveis com este empreendimento aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">{clients.length}</strong> cliente{clients.length !== 1 ? 's' : ''} compatíve{clients.length !== 1 ? 'is' : 'l'}
        </p>
      </div>

      <div className="space-y-2">
        {clients.map(client => {
          const reasons = getMatchReasons(l, client);

          return (
            <button
              key={client.id}
              onClick={() => onClientSelect?.(client)}
              className="w-full card-elevated p-3.5 text-left hover:ring-1 hover:ring-accent/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-foreground truncate">{client.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{client.phone}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              {/* Client criteria */}
              <div className="flex items-center gap-3 mt-2.5 flex-wrap text-[11px] text-muted-foreground">
                {client.budget_max && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Até {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.budget_max)}
                  </span>
                )}
                {client.bedrooms_min && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3 h-3" />{client.bedrooms_min}+ quartos
                  </span>
                )}
                {client.preferred_region && (
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <MapPin className="w-3 h-3 shrink-0" />{client.preferred_region}
                  </span>
                )}
              </div>

              {/* Match reasons */}
              {reasons.length > 0 && (
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {reasons.map(r => (
                    <Badge key={r} className="text-[9px] bg-accent/10 text-accent border-0 font-medium px-2 py-0.5">{r}</Badge>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getMatchReasons(l: Lancamento, client: Client): string[] {
  const reasons: string[] = [];
  if (l.bairro && client.preferred_region?.toLowerCase().includes(l.bairro.toLowerCase())) reasons.push('Bairro');
  if (l.cidade && client.cidades?.some(c => c.toLowerCase().includes(l.cidade!.toLowerCase()))) reasons.push('Cidade');
  if (l.valor_min && client.budget_max && client.budget_max >= l.valor_min) reasons.push('Orçamento');
  if (l.quartos_min && client.bedrooms_min && l.quartos_max && client.bedrooms_min <= l.quartos_max) reasons.push('Quartos');
  return reasons;
}
