import { Client, ClientStage, STAGE_LABELS, ClientInteraction, INTERACTION_LABELS, STAGES_ORDER, PROPERTY_TYPE_OPTIONS, TRANSACTION_TYPE_OPTIONS, LEISURE_FEATURE_OPTIONS, URGENCIA_OPTIONS, FINALIDADE_OPTIONS, FORMA_PAGAMENTO_OPTIONS, ELEVATOR_OPTIONS, PORTARIA_OPTIONS } from '@/types/client';
import { DealWithClients } from '@/types/deal';
import { LinkifyText } from '@/components/ui/linkify-text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useClient, useClientInteractions, useCreateInteraction, useDeleteClient, useUpdateClientStage, useUpdateClient } from '@/hooks/useClients';
import { useClientAppointments, useCreateAppointment } from '@/hooks/useAppointments';
import { useClientTasks, useCreateTask, useCompleteTask, useUpdateTask, getDeadlineInfo, Task } from '@/hooks/useTasks';
import { EditTaskForm } from '@/components/tasks/EditTaskForm';
import { useDealMatches } from '@/hooks/useDealMatches';
import { useDeals, useDealClients, useUpdateDealClientStage } from '@/hooks/useDeals';
import { LinkedProperties } from './LinkedProperties';
import { useIsMaster } from '@/hooks/useUserRole';
import { useUsers } from '@/hooks/useUsers';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditClientForm } from './EditClientForm';
import { DealMatches } from './DealMatches';
import { TaskFormSimple } from '@/components/tasks/TaskFormSimple';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Clock,
  ClipboardList,
  Edit,
  Trash2,
  PhoneCall,
  Send,
  Eye,
  FileText,
  Plus,
  Loader2,
  ArrowRightLeft,
  UserCheck,
  Home,
  Link2,
  Car,
  Maximize2,
  BedDouble,
  Waves,
  CheckCircle,
  ShoppingBag,
} from 'lucide-react';

interface ClientDetailProps {
  client: Client;
  onClose: () => void;
  onDealSelect?: (deal: DealWithClients) => void;
  zIndex?: number;
}

export function ClientDetail({ client: initialClient, onClose, onDealSelect, zIndex }: ClientDetailProps) {
  // Fetch fresh client data from cache/server to stay in sync with mutations
  const { data: freshClient } = useClient(initialClient.id);
  
  // Use fresh data when available, fallback to initial prop
  const client = freshClient || initialClient;
  
  const { data: interactions = [], isLoading: loadingInteractions, refetch: refetchInteractions } = useClientInteractions(client.id);
  const { data: appointments = [], isLoading: loadingAppointments } = useClientAppointments(client.id);
  const { data: clientTasks = [], isLoading: loadingTasks } = useClientTasks(client.id);
  const { data: users = [] } = useUsers();
  const { 
    data: dealMatches = [], 
    isLoading: loadingMatches, 
    isRefreshing: refreshingMatches,
    forceRefresh: refetchMatches,
  } = useDealMatches({ client });
  const { data: allDeals = [] } = useDeals();
  const createInteraction = useCreateInteraction();
  const createAppointment = useCreateAppointment();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteClient = useDeleteClient();
  const updateClientStage = useUpdateClientStage();
  const updateClient = useUpdateClient();
  const isMaster = useIsMaster();

  // Linked deals for this client
  const linkedDeals = useMemo(() => {
    return allDeals.filter(deal =>
      deal.deal_clients?.some(dc => dc.client_id === client.id)
    );
  }, [allDeals, client.id]);

  // Count unique properties sent (links from interactions + linked deals, deduplicated)
  const { imoveisEnviados, imoveisVinculados } = useMemo(() => {
    const urlRegex = /https?:\/\/[^\s"<>]+/gi;
    const uniqueUrls = new Set<string>();

    // Extract URLs from interaction notes
    interactions.forEach(interaction => {
      if (interaction.notes) {
        const matches = interaction.notes.match(urlRegex);
        if (matches) {
          matches.forEach(url => uniqueUrls.add(url.replace(/[.,;!?)]+$/, '').toLowerCase()));
        }
      }
    });

    // Linked deal URLs
    const linkedUrls = new Set<string>();
    linkedDeals.forEach(deal => {
      if (deal.listing_url) {
        linkedUrls.add(deal.listing_url.replace(/[.,;!?)]+$/, '').toLowerCase());
      }
    });

    // Total = unique URLs from interactions + linked deals that are NOT already in interaction URLs
    const totalUnique = new Set(uniqueUrls);
    linkedUrls.forEach(url => totalUnique.add(url));

    return {
      imoveisEnviados: totalUnique.size,
      imoveisVinculados: linkedDeals.length,
    };
  }, [interactions, linkedDeals]);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskInTimeline, setEditingTaskInTimeline] = useState<Task | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [whatsappPopup, setWhatsappPopup] = useState(false);
  const [whatsappNotes, setWhatsappNotes] = useState('');
  const [callPopup, setCallPopup] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [emailPopup, setEmailPopup] = useState(false);
  const [emailNotes, setEmailNotes] = useState('');
  const [stageChangePopup, setStageChangePopup] = useState(false);
  const [pendingStage, setPendingStage] = useState<ClientStage | null>(null);
  const [stageChangeNotes, setStageChangeNotes] = useState('');
  const completeTask = useCompleteTask();

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user?.full_name || 'Usuário desconhecido';
  };

  // Handle stage change - open popup for justification
  const handleStageChange = (newStage: ClientStage) => {
    if (newStage !== client.stage) {
      setPendingStage(newStage);
      setStageChangeNotes('');
      setStageChangePopup(true);
    }
  };

  const confirmStageChange = async () => {
    if (!pendingStage) return;
    await updateClientStage.mutateAsync({
      id: client.id,
      stage: pendingStage,
      previousStage: client.stage,
      notes: stageChangeNotes || undefined,
    });
    setStageChangePopup(false);
    setPendingStage(null);
    setStageChangeNotes('');
  };

  const handleDealMatchRefresh = () => {
    refetchMatches();
  };

  // Get broker info
  const broker = useMemo(() => {
    if (!client.assigned_to) return null;
    return users.find((u) => u.user_id === client.assigned_to);
  }, [client.assigned_to, users]);

  // Combine interactions, appointments and tasks into a single timeline
  const timeline = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'interaction' | 'appointment' | 'task';
      date: Date;
      data: any;
    }> = [];

    // Add interactions
    interactions.forEach((interaction) => {
      items.push({
        id: `interaction-${interaction.id}`,
        type: 'interaction',
        date: new Date(interaction.created_at),
        data: interaction,
      });
    });

    // Add appointments
    appointments.forEach((appointment) => {
      items.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        date: new Date(appointment.start_time),
        data: appointment,
      });
    });

    // Add tasks
    clientTasks.forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        type: 'task',
        date: new Date(task.due_date),
        data: task,
      });
    });

    // Pending tasks pinned at top, then everything sorted by date descending
    return items.sort((a, b) => {
      const aIsPendingTask = a.type === 'task' && (a.data as any).status !== 'completed';
      const bIsPendingTask = b.type === 'task' && (b.data as any).status !== 'completed';
      if (aIsPendingTask && !bIsPendingTask) return -1;
      if (!aIsPendingTask && bIsPendingTask) return 1;
      return b.date.getTime() - a.date.getTime();
    });
  }, [interactions, appointments, clientTasks]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-4 h-4" />;
      case 'email':
        return <Send className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'visit':
        return <Eye className="w-4 h-4" />;
      case 'meeting':
        return <User className="w-4 h-4" />;
      case 'stage_change':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Use the correct stage order from pipeline
  const currentStageIndex = STAGES_ORDER.indexOf(client.stage);

  const handleAddInteraction = async (type: 'call' | 'email' | 'whatsapp' | 'visit' | 'meeting', notes: string) => {
    await createInteraction.mutateAsync({
      client_id: client.id,
      type,
      notes,
    });
    setShowInteractionForm(false);
  };

  const handleCreateTask = async (data: { title: string; description?: string; due_date: string; client_id?: string; deal_id?: string }) => {
    await createTask.mutateAsync({
      ...data,
      client_id: client.id,
    });
    setShowTaskForm(false);
  };

  // Automatic interaction logging
  const logAutomaticInteraction = async (type: 'call' | 'whatsapp' | 'email') => {
    const typeLabels = {
      call: 'Ligação realizada',
      whatsapp: 'Mensagem WhatsApp enviada',
      email: 'Email enviado',
    };
    await createInteraction.mutateAsync({
      client_id: client.id,
      type,
      notes: typeLabels[type],
    });
  };

  const handleCall = () => {
    setCallNotes('');
    setCallPopup(true);
  };

  const confirmCall = async () => {
    await createInteraction.mutateAsync({
      client_id: client.id,
      type: 'call',
      notes: callNotes || 'Ligação realizada',
    });
    setCallPopup(false);
    window.location.href = `tel:${client.phone}`;
  };

  const handleWhatsApp = () => {
    setWhatsappNotes('');
    setWhatsappPopup(true);
  };

  const confirmWhatsApp = async () => {
    await createInteraction.mutateAsync({
      client_id: client.id,
      type: 'whatsapp',
      notes: whatsappNotes || 'Mensagem WhatsApp enviada',
    });
    setWhatsappPopup(false);
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleEmail = () => {
    if (client.email) {
      setEmailNotes('');
      setEmailPopup(true);
    }
  };

  const confirmEmail = async () => {
    await createInteraction.mutateAsync({
      client_id: client.id,
      type: 'email',
      notes: emailNotes || 'Email enviado',
    });
    setEmailPopup(false);
    window.location.href = `mailto:${client.email}`;
  };

  const handleDelete = async () => {
    await deleteClient.mutateAsync(client.id);
    onClose();
  };

  if (showEditForm) {
    return <EditClientForm client={client} onClose={() => setShowEditForm(false)} onSuccess={onClose} />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black/30 animate-fade-in" style={{ zIndex: zIndex || 50 }}>
      <div className="h-full w-full max-w-xl bg-card shadow-dramatic animate-slide-up overflow-y-auto overscroll-contain pb-safe">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-accent/30 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-lg font-medium">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base sm:text-xl font-semibold text-foreground break-words">{client.name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{client.property_type} • {client.preferred_region}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEditForm(true)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Editar cliente"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              {isMaster && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Excluir cliente"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <button 
              onClick={handleCall}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg bg-accent text-accent-foreground font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Ligar</span>
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg bg-success text-success-foreground font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">WhatsApp</span>
            </button>
            {client.email && (
              <button 
                onClick={handleEmail}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-xs sm:text-sm hover:bg-secondary/80 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Email</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex flex-col">
          {/* Broker Info */}
          {broker && (
            <div className="card-elevated p-3 sm:p-4 bg-accent/5 border-accent/20 order-1 sm:order-none">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <UserCheck className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Corretor Responsável</p>
                  <p className="text-sm font-medium text-foreground">{broker.full_name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stage Progress */}
          <div className="card-elevated p-3 sm:p-4 order-2 sm:order-none">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Estágio do Cliente</h3>
              <Select 
                value={client.stage} 
                onValueChange={(value) => handleStageChange(value as ClientStage)}
                disabled={updateClientStage.isPending}
              >
                <SelectTrigger className={cn(
                  "w-auto h-7 sm:h-8 text-xs sm:text-sm font-medium gap-1 px-2 sm:px-3",
                  client.stage === 'quarantine' ? 'text-gray-600 border-gray-300' : 
                  client.stage === 'lost' ? 'text-destructive border-destructive/50' : 
                  client.stage === 'closed' ? 'text-green-600 border-green-300' : 
                  'text-accent border-accent/50'
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage} className="text-xs sm:text-sm">
                      {STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {STAGES_ORDER.slice(0, 6).map((stage, index) => (
                <div key={stage} className="flex-1 relative">
                  <div
                    className={cn(
                      'h-1.5 sm:h-2 rounded-full transition-colors',
                      index <= currentStageIndex && currentStageIndex < 6
                        ? 'bg-accent'
                        : 'bg-secondary'
                    )}
                  />
                  {index === currentStageIndex && currentStageIndex < 6 && (
                    <div className="absolute -top-0.5 sm:-top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-accent border-2 border-card" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 sm:mt-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Lead</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Fechado</span>
            </div>
          </div>

          {/* Contact Info - appears after Client Info on mobile */}
          <div className="card-elevated p-3 sm:p-4 space-y-2 sm:space-y-3 order-4 sm:order-none">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Informações de Contato</h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm text-foreground break-all">{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm text-foreground break-all">{client.email}</span>
              </div>
            )}
          </div>

          {/* Property Preferences - Enhanced */}
          <div className="card-elevated p-3 sm:p-4 space-y-3 sm:space-y-4 order-5 sm:order-none">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Perfil de Busca do Cliente</h3>
              <div className="flex items-center gap-2">
                {client.is_investidor && (
                  <Badge className="bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] sm:text-xs">
                    Investidor
                  </Badge>
                )}
                {client.transaction_type && (
                  <Badge variant={client.transaction_type === 'rent' ? 'secondary' : 'default'} className="text-[10px] sm:text-xs">
                    {TRANSACTION_TYPE_OPTIONS.find(t => t.value === client.transaction_type)?.label || client.transaction_type}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Budget & Region */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 sm:gap-3 p-2 rounded-lg bg-secondary/30">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Orçamento Máximo</p>
                  <p className="text-sm sm:text-base font-semibold text-foreground">
                    {client.budget_max 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.budget_max)
                      : client.budget || 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 p-2 rounded-lg bg-secondary/30">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Região Preferida</p>
                    {client.region_flexible ? (
                      <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1.5 py-0">
                        Aceita região
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1.5 py-0">
                        Bairros específicos
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-foreground break-words">{client.preferred_region || 'Não informada'}</p>
                </div>
              </div>
            </div>

            {/* Property Specifications */}
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-3">
              <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-secondary/30 text-center">
                <BedDouble className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mb-1" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Quartos</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {client.bedrooms_min ? `${client.bedrooms_min}+` : '-'}
                </p>
              </div>
              <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-secondary/30 text-center">
                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mb-1" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Vagas</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {client.parking_min ? `${client.parking_min}+` : '-'}
                </p>
              </div>
              <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-secondary/30 text-center">
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mb-1" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Área mín.</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {client.area_min ? `${client.area_min}m²` : '-'}
                </p>
              </div>
              <div className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-secondary/30 text-center">
                <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mb-1" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Lazer</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  {client.needs_leisure ? 'Sim' : 'Não'}
                </p>
              </div>
            </div>

            {/* Property Types */}
            {(client.property_types && client.property_types.length > 0) || client.property_type ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Tipos de Imóvel</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {client.property_types && client.property_types.length > 0 ? (
                    client.property_types.map((type) => (
                      <Badge key={type} variant="outline" className="text-[10px] sm:text-xs">
                        {PROPERTY_TYPE_OPTIONS.find(t => t.value === type)?.label || type}
                      </Badge>
                    ))
                  ) : client.property_type ? (
                    <Badge variant="outline" className="text-[10px] sm:text-xs">{client.property_type}</Badge>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Leisure Features */}
            {client.leisure_features && client.leisure_features.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Waves className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Itens de Lazer Desejados</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {client.leisure_features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-[10px] sm:text-xs">
                      {LEISURE_FEATURE_OPTIONS.find(f => f.value === feature)?.label || feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Portaria */}
            {client.portaria_preferencia && client.portaria_preferencia.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Portaria Desejada</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {client.portaria_preferencia.map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] sm:text-xs">
                      {PORTARIA_OPTIONS.find(o => o.value === p)?.label || p}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Linked Properties */}
          <div className="card-elevated p-3 sm:p-4 order-8 sm:order-none">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-accent" />
              <h3 className="text-xs sm:text-sm font-medium text-foreground">Imóveis Vinculados</h3>
            </div>
            <LinkedProperties clientId={client.id} clientName={client.name} onDealSelect={onDealSelect} />
          </div>

          {/* Deal Matches */}
          <div className="card-elevated p-3 sm:p-4 order-7 sm:order-none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-accent" />
                <h3 className="text-xs sm:text-sm font-medium text-foreground">Imóveis Compatíveis</h3>
              </div>
              {dealMatches.length > 0 && (
                <Badge className="text-[10px] bg-amber-500 text-white border-amber-500 hover:bg-amber-600">
                  {dealMatches.length} match{dealMatches.length !== 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
            <DealMatches
              clientId={client.id}
              matches={dealMatches}
              isLoading={loadingMatches}
              isRefreshing={refreshingMatches}
              onRefresh={handleDealMatchRefresh}
              onDealSelect={onDealSelect}
            />
          </div>

          {/* Client Info - appears before Contact Info on mobile */}
          <div className="card-elevated p-3 sm:p-4 space-y-2 sm:space-y-3 order-3 sm:order-none">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Cadastro</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Última Interação</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    {interactions.length > 0
                      ? new Date(interactions[0].created_at).toLocaleDateString('pt-BR')
                      : 'Nenhuma'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Origem</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{client.source || 'Não informada'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Jornada do Cliente</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {(() => {
                        const isClosed = client.stage === 'closed' || client.stage === 'lost';
                        
                        const stageChanges = interactions
                          .filter(i => i.type === 'stage_change')
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        
                        let start = new Date(client.created_at);
                        let end = new Date();
                        
                        if (isClosed) {
                          const closedChange = stageChanges.find(i => {
                            const closedLabel = client.stage === 'closed' ? 'Fechado' : 'Desistência';
                            return i.notes?.includes(`para "${closedLabel}"`);
                          });
                          if (closedChange) {
                            end = new Date(closedChange.created_at);
                          }
                          
                          const restartChange = stageChanges.find(i => {
                            return (i.notes?.includes('de "Fechado"') || i.notes?.includes('de "Desistência"'));
                          });
                          if (restartChange && closedChange && new Date(restartChange.created_at) < new Date(closedChange.created_at)) {
                            start = new Date(restartChange.created_at);
                          }
                        } else {
                          const restartChange = stageChanges.find(i => {
                            return (i.notes?.includes('de "Fechado"') || i.notes?.includes('de "Desistência"'));
                          });
                          if (restartChange) {
                            start = new Date(restartChange.created_at);
                          }
                        }
                        
                        const diffMs = end.getTime() - start.getTime();
                        const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                        const years = Math.floor(totalDays / 365);
                        const months = Math.floor((totalDays % 365) / 30);
                        const days = totalDays - (years * 365) - (months * 30);
                        const parts: string[] = [];
                        if (years > 0) parts.push(`${years}a`);
                        if (months > 0) parts.push(`${months}m`);
                        if (days > 0 || parts.length === 0) parts.push(`${days}d`);
                        return parts.join(' ');
                      })()}
                    </p>
                    {(client.stage === 'closed' || client.stage === 'lost') && (
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0",
                        client.stage === 'closed' ? 'border-green-500 text-green-600' : 'border-destructive text-destructive'
                      )}>
                        {STAGE_LABELS[client.stage]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Imóveis Enviados</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{imoveisEnviados}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Imóveis Vinculados</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{imoveisVinculados}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="card-elevated p-3 sm:p-4 order-6 sm:order-none">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Observações</h3>
              <p className="text-xs sm:text-sm text-foreground">{client.notes}</p>
            </div>
          )}

          {/* Interaction Timeline */}
          <div className="card-elevated p-3 sm:p-4 order-10 sm:order-none">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Histórico de Interações</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <ClipboardList className="w-3 h-3" />
                  Tarefa
                </button>
                <button 
                  onClick={() => setShowInteractionForm(true)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  Interação
                </button>
              </div>
            </div>

            {showTaskForm && (
              <TaskFormSimple
                onSubmit={handleCreateTask}
                onCancel={() => setShowTaskForm(false)}
                isLoading={createTask.isPending}
                defaultClientId={client.id}
                hideClient
              />
            )}

            {showInteractionForm && (
              <InteractionForm 
                onSubmit={handleAddInteraction} 
                onCancel={() => setShowInteractionForm(false)}
                isLoading={createInteraction.isPending}
              />
            )}

            {(loadingInteractions || loadingAppointments) ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                Nenhuma interação registrada
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {timeline.map((item) => {
                  if (item.type === 'interaction') {
                    const interaction = item.data as ClientInteraction;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/50"
                      >
                        <div className={cn(
                          "p-1.5 sm:p-2 rounded-lg flex-shrink-0",
                          interaction.type === 'stage_change' ? 'bg-purple-500/10 text-purple-500' : 'bg-accent/10 text-accent'
                        )}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs sm:text-sm font-medium text-foreground break-words">
                              {interaction.notes?.startsWith('Tarefa criada:') || interaction.notes?.startsWith('Tarefa concluída:') ? 'Tarefa' : INTERACTION_LABELS[interaction.type]}
                            </p>
                            <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                              {new Date(interaction.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {interaction.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 whitespace-pre-wrap break-words">
                              <LinkifyText text={interaction.notes} />
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {getUserName(interaction.created_by)}
                          </p>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'task') {
                    // Task
                    const task = item.data;
                    const deadline = getDeadlineInfo(task.due_date, task.status);

                    if (editingTaskInTimeline?.id === task.id) {
                      return (
                        <EditTaskForm
                          key={item.id}
                          task={task as Task}
                          onSubmit={(data) => {
                            updateTask.mutate(data, {
                              onSuccess: () => setEditingTaskInTimeline(null),
                            });
                          }}
                          onCancel={() => setEditingTaskInTimeline(null)}
                          isLoading={updateTask.isPending}
                          hideClient
                        />
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg",
                          task.status === 'completed' ? "bg-secondary/50 opacity-60" : "bg-accent/10 border border-accent/20"
                        )}
                      >
                        <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0 bg-accent/10 text-accent">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-xs sm:text-sm font-medium text-foreground break-words", task.status === 'completed' && 'line-through')}>
                              {task.title}
                            </p>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0',
                              deadline.variant === 'overdue' && 'bg-destructive/10 text-destructive',
                              deadline.variant === 'today' && 'bg-amber-100 text-amber-700',
                              deadline.variant === 'ontime' && 'bg-emerald-100 text-emerald-700',
                              deadline.variant === 'completed' && 'bg-secondary text-muted-foreground',
                            )}>
                              {deadline.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            Prazo: {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {task.deal && (
                            <div className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md bg-secondary/60 w-fit">
                              <Home className="w-3 h-3 text-accent flex-shrink-0" />
                              <span className="text-[11px] font-medium text-foreground truncate max-w-[200px]">
                                {task.deal.title || task.deal.bairro || 'Imóvel vinculado'}
                              </span>
                            </div>
                          )}
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          )}
                          {task.status !== 'completed' && (
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                onClick={() => completeTask.mutate({ id: task.id, client_id: task.client_id, deal_id: task.deal_id, title: task.title })}
                                disabled={completeTask.isPending}
                                className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                {completeTask.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Concluir
                              </button>
                              <button
                                onClick={() => setEditingTaskInTimeline(task as Task)}
                                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-medium"
                              >
                                <Edit className="w-3 h-3" />
                                Editar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Appointment
                    const appointment = item.data;
                    const isFuture = new Date(appointment.start_time) > new Date();
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg",
                          isFuture ? "bg-accent/10 border border-accent/20" : "bg-secondary/50"
                        )}
                      >
                        <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0 bg-accent/10 text-accent">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs sm:text-sm font-medium text-foreground break-words">
                              {appointment.title}
                            </p>
                            {isFuture && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground flex-shrink-0">
                                Agendado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {appointment.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {appointment.location}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {getUserName(appointment.created_by)}
                          </p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o cliente "{client.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* WhatsApp Justification Popup */}
        <AlertDialog open={whatsappPopup} onOpenChange={setWhatsappPopup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Contato via WhatsApp</AlertDialogTitle>
              <AlertDialogDescription>
                Descreva o motivo do contato com {client.name}. Isso será registrado no histórico de interações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              placeholder="Ex: Envio de novos imóveis compatíveis..."
              value={whatsappNotes}
              onChange={(e) => setWhatsappNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmWhatsApp} disabled={createInteraction.isPending} className="bg-success text-success-foreground hover:bg-success/90">
                {createInteraction.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MessageSquare className="w-4 h-4 mr-1" />}
                Abrir WhatsApp
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Call Justification Popup */}
        <AlertDialog open={callPopup} onOpenChange={setCallPopup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ligação para Cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Descreva o motivo da ligação para {client.name}. Isso será registrado no histórico de interações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              placeholder="Ex: Retorno sobre visita agendada..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCall} disabled={createInteraction.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {createInteraction.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Phone className="w-4 h-4 mr-1" />}
                Ligar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Email Justification Popup */}
        <AlertDialog open={emailPopup} onOpenChange={setEmailPopup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Email para Cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Descreva o motivo do email para {client.name}. Isso será registrado no histórico de interações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              placeholder="Ex: Envio de proposta comercial..."
              value={emailNotes}
              onChange={(e) => setEmailNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmEmail} disabled={createInteraction.isPending} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                {createInteraction.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Mail className="w-4 h-4 mr-1" />}
                Enviar Email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stage Change Justification Popup */}
        <AlertDialog open={stageChangePopup} onOpenChange={(open) => { if (!open) { setStageChangePopup(false); setPendingStage(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Estágio</AlertDialogTitle>
              <AlertDialogDescription>
                Descreva o motivo da alteração de estágio do cliente. Isso será registrado no histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              placeholder="Ex: Cliente demonstrou interesse em visitar imóvel..."
              value={stageChangeNotes}
              onChange={(e) => setStageChangeNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStageChange} disabled={updateClientStage.isPending}>
                {updateClientStage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ArrowRightLeft className="w-4 h-4 mr-1" />}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Simple Appointment Form for Client Page
interface AppointmentFormSimpleProps {
  onSubmit: (data: { title: string; start_time: string; end_time: string; type: string; location?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AppointmentFormSimple({ onSubmit, onCancel, isLoading }: AppointmentFormSimpleProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('visit');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    
    onSubmit({
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      type,
      location: location || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-3 rounded-lg border border-border bg-secondary/30">
      <input
        type="text"
        placeholder="Título do compromisso"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      
      <div className="grid grid-cols-2 gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="visit">Visita</option>
          <option value="meeting">Reunião</option>
          <option value="call">Ligação</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>

      <input
        type="text"
        placeholder="Local (opcional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || !title}
          className="flex-1 py-2 rounded-lg gradient-gold text-white text-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Agendar'}
        </button>
      </div>
    </form>
  );
}

// Interaction Form Component
interface InteractionFormProps {
  onSubmit: (type: 'call' | 'email' | 'whatsapp' | 'visit' | 'meeting', notes: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function InteractionForm({ onSubmit, onCancel, isLoading }: InteractionFormProps) {
  const [type, setType] = useState<'call' | 'email' | 'whatsapp' | 'visit' | 'meeting'>('call');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(type, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-3 rounded-lg border border-border bg-secondary/30">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as any)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      >
        <option value="call">Ligação</option>
        <option value="email">Email</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="visit">Visita</option>
        <option value="meeting">Reunião</option>
      </select>
      <textarea
        placeholder="Observações..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 rounded-lg gradient-gold text-white text-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
