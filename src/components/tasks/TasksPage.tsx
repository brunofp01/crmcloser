import { useState, useMemo } from 'react';
import { useTasks, useCreateTask, useCompleteTask, useDeleteTask, useUpdateTask, getDeadlineInfo, getTaskTypeLabel, TASK_TYPE_OPTIONS, Task } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useDeals } from '@/hooks/useDeals';
import { useUsers } from '@/hooks/useUsers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Loader2, Plus, CheckCircle2, Circle, Trash2, User, Building2, Calendar, X, Clock, Edit, Home,
} from 'lucide-react';
import { Client } from '@/types/client';
import { EditTaskForm } from './EditTaskForm';
import { DealSelectorDialog } from './DealSelectorDialog';

type FilterStatus = 'all' | 'pending' | 'completed';

interface TasksPageProps {
  onClientSelect?: (client: Client) => void;
}

export function TasksPage({ onClientSelect }: TasksPageProps) {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: clients = [] } = useClients();
  const { data: deals = [] } = useDeals();
  const { data: users = [] } = useUsers();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDealSelector, setShowDealSelector] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [dealId, setDealId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [taskType, setTaskType] = useState('other');

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.full_name || 'Usuário';
  };

  const getSelectedDealLabel = () => {
    if (!dealId) return null;
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return null;
    return deal.title || deal.bairro || 'Imóvel selecionado';
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'pending' && task.status === 'pending') ||
        (statusFilter === 'completed' && task.status === 'completed');
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask.mutateAsync({
      title,
      description: description || undefined,
      client_id: clientId || undefined,
      deal_id: dealId || undefined,
      due_date: new Date(dueDate + 'T23:59:59').toISOString(),
      type: taskType,
    });
    setTitle('');
    setDescription('');
    setClientId('');
    setDealId('');
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setTaskType('other');
    setShowForm(false);
  };

  const handleComplete = (task: Task) => {
    completeTask.mutate({
      id: task.id,
      client_id: task.client_id,
      deal_id: task.deal_id,
      title: task.title,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta tarefa?')) {
      deleteTask.mutate(id);
    }
  };

  const handleUpdate = (data: any) => {
    updateTask.mutate(data, {
      onSuccess: () => setEditingTask(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gradient-gold text-white gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { key: 'pending', label: 'Pendentes' },
          { key: 'completed', label: 'Concluídas' },
          { key: 'all', label: 'Todas' },
        ] as { key: FilterStatus; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
              statusFilter === key
                ? 'bg-accent text-white border-accent'
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
            )}
          >
            {label}
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
              statusFilter === key ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
            )}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* New task form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-elevated p-4 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Nova Tarefa</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <Input placeholder="Título da tarefa *" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea
            placeholder="Descrição (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-none"
          />

          {/* Task type selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Tipo de tarefa</label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTaskType(opt.value)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1',
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Prazo *</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cliente (opcional)</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Nenhum</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Imóvel (opcional)</label>
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
          </div>
          <Button type="submit" className="w-full gradient-gold" disabled={createTask.isPending}>
            {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Criar Tarefa
          </Button>
        </form>
      )}

      {/* Deal Selector Dialog */}
      <DealSelectorDialog
        open={showDealSelector}
        onOpenChange={setShowDealSelector}
        selectedDealId={dealId}
        onSelect={setDealId}
      />

      {/* Task count */}
      <p className="text-sm text-muted-foreground">
        {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
      </p>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-2">Nenhuma tarefa encontrada</p>
          <p className="text-sm text-muted-foreground">Crie sua primeira tarefa clicando em "Nova Tarefa"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const deadline = getDeadlineInfo(task.due_date, task.status);
            const isCompleted = task.status === 'completed';
            const typeInfo = getTaskTypeLabel(task.type);

            if (editingTask?.id === task.id) {
              return (
                <EditTaskForm
                  key={task.id}
                  task={task}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingTask(null)}
                  isLoading={updateTask.isPending}
                />
              );
            }

            return (
              <div
                key={task.id}
                onClick={() => {
                  if (task.client && onClientSelect) {
                    onClientSelect(task.client as unknown as Client);
                  }
                }}
                className={cn(
                  'card-elevated p-4 transition-all animate-scale-in',
                  isCompleted && 'opacity-60',
                  task.client && onClientSelect && 'cursor-pointer hover:ring-1 hover:ring-accent/30'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Complete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); !isCompleted && handleComplete(task); }}
                    disabled={isCompleted || completeTask.isPending}
                    className={cn(
                      'mt-0.5 shrink-0 transition-colors',
                      isCompleted ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">{typeInfo.icon}</span>
                        <h4 className={cn(
                          'font-semibold text-sm text-foreground break-words',
                          isCompleted && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </h4>
                      </div>
                      <Badge className={cn(
                        'text-[10px] shrink-0 border-0',
                        deadline.variant === 'overdue' && 'bg-destructive/10 text-destructive',
                        deadline.variant === 'today' && 'bg-amber-100 text-amber-700',
                        deadline.variant === 'ontime' && 'bg-emerald-100 text-emerald-700',
                        deadline.variant === 'completed' && 'bg-secondary text-muted-foreground',
                      )}>
                        {deadline.label}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{typeInfo.label}</Badge>
                      {task.client && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-accent" />
                          {task.client.name}
                        </span>
                      )}
                      {task.deal && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-accent" />
                          {task.deal.title || task.deal.bairro || 'Imóvel'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit + Delete buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                        className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
