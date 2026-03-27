import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeals } from '@/hooks/useDeals';
import { useClients } from '@/hooks/useClients';
import { TASK_TYPE_OPTIONS } from '@/hooks/useTasks';
import { DealSelectorDialog } from './DealSelectorDialog';
import { cn } from '@/lib/utils';

interface TaskFormSimpleProps {
  onSubmit: (data: { title: string; description?: string; due_date: string; client_id?: string; deal_id?: string; type?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
  defaultClientId?: string;
  defaultDealId?: string;
  hideClient?: boolean;
  hideDeal?: boolean;
}

export function TaskFormSimple({ onSubmit, onCancel, isLoading, defaultClientId, defaultDealId, hideClient, hideDeal }: TaskFormSimpleProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientId, setClientId] = useState(defaultClientId || '');
  const [dealId, setDealId] = useState(defaultDealId || '');
  const [taskType, setTaskType] = useState('other');
  const [showDealSelector, setShowDealSelector] = useState(false);

  const { data: deals = [] } = useDeals();
  const { data: clients = [] } = useClients();

  const getSelectedDealLabel = () => {
    if (!dealId) return null;
    const deal = deals.find(d => d.id === dealId);
    return deal ? (deal.title || deal.bairro || 'Imóvel selecionado') : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || undefined,
      due_date: new Date(dueDate + 'T23:59:59').toISOString(),
      client_id: clientId || undefined,
      deal_id: dealId || undefined,
      type: taskType,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-3 rounded-lg border border-border bg-secondary/30">
        <Input placeholder="Título da tarefa *" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[50px] resize-none"
        />

        {/* Task type */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Tipo</label>
          <div className="flex flex-wrap gap-1">
            {TASK_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTaskType(opt.value)}
                className={cn(
                  'px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1',
                  taskType === opt.value
                    ? 'bg-accent text-white border-accent'
                    : 'bg-secondary text-muted-foreground border-border hover:border-accent/50'
                )}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prazo</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          {!hideClient && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Nenhum</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {!hideDeal && (
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Imóvel</label>
              <button
                type="button"
                onClick={() => setShowDealSelector(true)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center gap-2 transition-colors',
                  dealId
                    ? 'border-accent bg-accent/5 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-accent/50'
                )}
              >
                {dealId ? (
                  <>
                    <Home className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="truncate">{getSelectedDealLabel()}</span>
                  </>
                ) : (
                  'Selecionar imóvel...'
                )}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Criar Tarefa
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>

      <DealSelectorDialog
        open={showDealSelector}
        onOpenChange={setShowDealSelector}
        selectedDealId={dealId}
        onSelect={setDealId}
      />
    </>
  );
}
