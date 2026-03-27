import { Lancamento } from '@/hooks/useLancamentos';
import { BedDouble, Car, Maximize2, Layers, Home, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  lancamento: Lancamento;
}

interface SpecItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function LancamentoSpecs({ lancamento: l }: Props) {
  const specs: SpecItem[] = [];

  if (l.quartos_min || l.quartos_max) {
    specs.push({
      icon: <BedDouble className="w-5 h-5" />,
      label: 'Quartos',
      value: l.quartos_min === l.quartos_max ? `${l.quartos_min}` : `${l.quartos_min || '?'} a ${l.quartos_max || '?'}`,
    });
  }
  if (l.suites_min || l.suites_max) {
    specs.push({
      icon: <BedDouble className="w-5 h-5" />,
      label: 'Suítes',
      value: l.suites_min === l.suites_max ? `${l.suites_min}` : `${l.suites_min || '?'} a ${l.suites_max || '?'}`,
    });
  }
  if (l.vagas_min || l.vagas_max) {
    specs.push({
      icon: <Car className="w-5 h-5" />,
      label: 'Vagas',
      value: l.vagas_min === l.vagas_max ? `${l.vagas_min}` : `${l.vagas_min || '?'} a ${l.vagas_max || '?'}`,
    });
  }
  if (l.area_min || l.area_max) {
    specs.push({
      icon: <Maximize2 className="w-5 h-5" />,
      label: 'Área',
      value: l.area_min === l.area_max ? `${l.area_min}m²` : `${l.area_min || '?'} a ${l.area_max || '?'}m²`,
    });
  }

  const buildingSpecs: SpecItem[] = [];
  if (l.andares) {
    buildingSpecs.push({ icon: <Layers className="w-5 h-5" />, label: 'Andares', value: `${l.andares}` });
  }
  if (l.unidades_por_andar) {
    buildingSpecs.push({ icon: <Home className="w-5 h-5" />, label: 'Un/Andar', value: `${l.unidades_por_andar}` });
  }
  if (l.total_unidades) {
    buildingSpecs.push({ icon: <Building2 className="w-5 h-5" />, label: 'Total Unidades', value: `${l.total_unidades}` });
  }

  if (specs.length === 0 && buildingSpecs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Unit specs */}
      {specs.length > 0 && (
        <div className="card-elevated p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Unidades</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.map((spec, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 text-center"
              >
                <div className="text-accent">{spec.icon}</div>
                <span className="text-base font-bold text-foreground">{spec.value}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{spec.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Building specs */}
      {buildingSpecs.length > 0 && (
        <div className="card-elevated p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Empreendimento</h3>
          <div className={cn('grid gap-3', buildingSpecs.length <= 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {buildingSpecs.map((spec, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 text-center"
              >
                <div className="text-accent">{spec.icon}</div>
                <span className="text-base font-bold text-foreground">{spec.value}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{spec.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tipo */}
      {l.tipo && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span className="font-medium text-foreground">Tipo:</span> {l.tipo}
        </div>
      )}
    </div>
  );
}
