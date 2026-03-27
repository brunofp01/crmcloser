import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { ClientStage, STAGE_LABELS, PRIORITY_LABELS, STAGES_ORDER } from '@/types/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUpdateClientStage } from '@/hooks/useClients';
import { useClientsWithBroker, ClientWithBroker } from '@/hooks/useClientsWithBroker';
import { MoreHorizontal, Calendar, DollarSign, MapPin, Loader2, UserCheck } from 'lucide-react';

const stageStyles: Record<ClientStage, { bg: string; border: string; header: string }> = {
  lead: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-500' },
  qualification: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-500' },
  contact: { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-500' },
  negotiation: { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-500' },
  visit: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-500' },
  proposal: { bg: 'bg-cyan-50', border: 'border-cyan-200', header: 'bg-cyan-500' },
  closed: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-500' },
  quarantine: { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-500' },
  lost: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-500' },
};

interface ClientCardProps {
  client: ClientWithBroker;
  onClick: () => void;
  index: number;
}

function ClientCard({ client, onClick, index }: ClientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'card-elevated p-4 cursor-pointer transition-all group',
            snapshot.isDragging ? 'shadow-prominent rotate-2' : 'hover:shadow-prominent'
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-foreground text-sm truncate">{client.name}</h4>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">{client.source || 'Sem origem'}</p>
                  {client.is_investidor && (
                    <Badge className="bg-emerald-700 text-white hover:bg-emerald-800 text-[9px] px-1.5 py-0">Investidor</Badge>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            {client.broker && (
              <div className="flex items-center gap-2 text-accent">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="truncate">{client.broker.full_name}</span>
              </div>
            )}
            {client.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="truncate">{client.budget}</span>
              </div>
            )}
            {client.preferred_region && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{client.preferred_region}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Criado: {new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full',
                client.priority === 'high' && 'bg-destructive/10 text-destructive',
                client.priority === 'medium' && 'bg-warning/10 text-warning',
                client.priority === 'low' && 'bg-muted text-muted-foreground'
              )}
            >
              {PRIORITY_LABELS[client.priority]}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

interface PipelineProps {
  onClientSelect: (client: ClientWithBroker) => void;
}

export function Pipeline({ onClientSelect }: PipelineProps) {
  const { data: clients = [], isLoading } = useClientsWithBroker();
  const updateClientStage = useUpdateClientStage();

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStage = destination.droppableId as ClientStage;
    const client = clients.find(c => c.id === draggableId);
    const previousStage = client?.stage;
    
    updateClientStage.mutate({ id: draggableId, stage: newStage, previousStage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-6 h-full overflow-x-auto">
        <div className="flex gap-3 md:gap-4 min-w-max pb-4">
          {STAGES_ORDER.map((stage) => {
            const stageClients = clients.filter((c) => c.stage === stage);
            const styles = stageStyles[stage];

            return (
              <div
                key={stage}
                className={cn(
                  'w-64 md:w-72 rounded-xl border-2 flex flex-col flex-shrink-0',
                  styles.bg,
                  styles.border
                )}
              >
                {/* Header */}
                <div className={cn('px-3 md:px-4 py-2 md:py-3 rounded-t-lg', styles.header)}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white text-xs md:text-sm">{STAGE_LABELS[stage]}</h3>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                      {stageClients.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 p-2 md:p-3 space-y-2 md:space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] md:max-h-[calc(100vh-280px)] min-h-[100px]',
                        snapshot.isDraggingOver && 'bg-white/50'
                      )}
                    >
                      {stageClients.length === 0 ? (
                        <div className="flex items-center justify-center h-20 md:h-24 border-2 border-dashed border-current/20 rounded-lg">
                          <p className="text-xs text-muted-foreground">Arraste clientes aqui</p>
                        </div>
                      ) : (
                        stageClients.map((client, index) => (
                          <ClientCard
                            key={client.id}
                            client={client}
                            index={index}
                            onClick={() => onClientSelect(client)}
                          />
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}
