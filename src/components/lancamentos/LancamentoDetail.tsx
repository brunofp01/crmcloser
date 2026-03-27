import { useState, useCallback } from 'react';
import { Lancamento, useDeleteLancamento } from '@/hooks/useLancamentos';
import { useClients } from '@/hooks/useClients';
import { useIsMaster } from '@/hooks/useUserRole';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronLeft, Trash2, X, Users, Info, Image as ImageIcon, Pencil } from 'lucide-react';
import { Client } from '@/types/client';
import { LancamentoHero } from './detail/LancamentoHero';
import { LancamentoOverview } from './detail/LancamentoOverview';
import { LancamentoSpecs } from './detail/LancamentoSpecs';
import { LancamentoGallery } from './detail/LancamentoGallery';
import { LancamentoMatchedClients } from './detail/LancamentoMatchedClients';
import { EditLancamentoForm } from './EditLancamentoForm';

interface LancamentoDetailProps {
  lancamento: Lancamento;
  onClose: () => void;
  onClientSelect?: (client: Client) => void;
}

type Tab = 'info' | 'gallery' | 'matches';

export function LancamentoDetail({ lancamento: l, onClose, onClientSelect }: LancamentoDetailProps) {
  const { data: allClients = [] } = useClients();
  const deleteLancamento = useDeleteLancamento();
  const isMaster = useIsMaster();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [editing, setEditing] = useState(false);
  const matchedClients = useMatchedClients(l, allClients);

  const handleDelete = useCallback(() => {
    if (confirm('Excluir este lançamento?')) {
      deleteLancamento.mutate(l.id, { onSuccess: onClose });
    }
  }, [l.id, deleteLancamento, onClose]);

  const hasPhotos = l.fotos && l.fotos.length > 0;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'info', label: 'Detalhes', icon: <Info className="w-3.5 h-3.5" /> },
    ...(hasPhotos ? [{ key: 'gallery' as Tab, label: 'Galeria', icon: <ImageIcon className="w-3.5 h-3.5" />, badge: l.fotos?.length }] : []),
    { key: 'matches', label: 'Clientes', icon: <Users className="w-3.5 h-3.5" />, badge: matchedClients.length },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Sticky Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">{l.nome}</h2>
            {l.construtora && <p className="text-[10px] text-muted-foreground">{l.construtora}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {isMaster && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex border-b border-border shrink-0 bg-card px-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-medium transition-all border-b-2 relative',
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                activeTab === tab.key
                  ? 'bg-accent/15 text-accent'
                  : 'bg-muted text-muted-foreground'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'info' && (
          <div className="space-y-0">
            <LancamentoHero lancamento={l} />
            <div className="p-4 space-y-4">
              <LancamentoOverview lancamento={l} />
              <LancamentoSpecs lancamento={l} />
            </div>
          </div>
        )}
        {activeTab === 'gallery' && (
          <LancamentoGallery lancamento={l} />
        )}
        {activeTab === 'matches' && (
          <LancamentoMatchedClients
            lancamento={l}
            clients={matchedClients}
            onClientSelect={onClientSelect}
          />
        )}
      </ScrollArea>

      {editing && (
        <EditLancamentoForm lancamento={l} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

/** Hook to compute matched clients for a lancamento */
function useMatchedClients(l: Lancamento, allClients: Client[]): Client[] {
  return allClients.filter(client => {
    if (l.valor_min && client.budget_max && client.budget_max < l.valor_min) return false;
    if (l.valor_max && client.budget_min && client.budget_min > l.valor_max) return false;
    if (client.bedrooms_min && l.quartos_max && client.bedrooms_min > l.quartos_max) return false;
    if (client.parking_min && l.vagas_max && client.parking_min > l.vagas_max) return false;
    if (client.area_min && l.area_max && client.area_min > l.area_max) return false;

    if (client.cidades && client.cidades.length > 0 && l.cidade) {
      const match = client.cidades.some(c => c.toLowerCase().includes(l.cidade!.toLowerCase()));
      if (!match && !client.region_flexible) return false;
    }

    if (client.preferred_region && l.bairro) {
      const regions = client.preferred_region.split(',').map(r => r.trim().toLowerCase());
      const bairroMatch = regions.some(r => l.bairro!.toLowerCase().includes(r));
      if (!bairroMatch && !client.region_flexible) return false;
    }

    const hasAnyMatch =
      (l.valor_min && client.budget_max && client.budget_max >= l.valor_min) ||
      (l.quartos_min && client.bedrooms_min && l.quartos_max && client.bedrooms_min <= l.quartos_max) ||
      (l.bairro && client.preferred_region && client.preferred_region.toLowerCase().includes(l.bairro.toLowerCase())) ||
      (l.cidade && client.cidades?.some(c => c.toLowerCase().includes(l.cidade!.toLowerCase())));

    return hasAnyMatch;
  });
}
