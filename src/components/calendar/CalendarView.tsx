import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { ChevronLeft, ChevronRight, Plus, Loader2, X, Clock, MapPin, User, Trash2, Phone, Users, Calendar, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface AppointmentData {
  id: string;
  title: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  type: string;
  location?: string;
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentData | null>(null);
  const isMobile = useIsMobile();

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const { data: appointments = [], isLoading } = useAppointments(start, end);
  const { data: clients = [] } = useClients();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.start_time), date));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowDayDetail(true);
    setShowForm(false);
    setEditingAppointment(null);
  };

  const handleCreateAppointment = async (data: { title: string; client_id?: string; start_time: string; end_time: string; type: string; location?: string }) => {
    await createAppointment.mutateAsync(data);
    setShowForm(false);
    setShowDayDetail(true);
  };

  const handleUpdateAppointment = async (data: { id: string; title: string; client_id?: string; start_time: string; end_time: string; type: string; location?: string }) => {
    await updateAppointment.mutateAsync(data);
    setShowForm(false);
    setEditingAppointment(null);
    setShowDayDetail(true);
  };

  const handleEditClick = (apt: AppointmentData) => {
    setEditingAppointment(apt);
    setShowForm(true);
    setShowDayDetail(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      await deleteAppointment.mutateAsync(id);
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      visit: 'Visita',
      meeting: 'Reunião',
      call: 'Ligação',
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit': return <MapPin className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="p-2 rounded-lg hover:bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-lg md:text-xl font-semibold capitalize">
            {format(currentMonth, isMobile ? 'MMM yyyy' : 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="p-2 rounded-lg hover:bg-secondary"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button 
          onClick={() => { setSelectedDate(new Date()); setShowForm(true); setShowDayDetail(false); setEditingAppointment(null); }} 
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg gradient-gold text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Compromisso</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="card-elevated overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-secondary/50">
          {(isMobile ? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']).map((day, i) => (
            <div key={i} className="p-2 md:p-3 text-center text-xs font-medium text-muted-foreground uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: start.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-1 md:p-2 border-t border-border min-h-[60px] md:min-h-[100px]" />
          ))}
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <div 
                key={day.toISOString()} 
                onClick={() => handleDayClick(day)} 
                className={cn(
                  'p-1 md:p-2 border-t border-border min-h-[60px] md:min-h-[100px] cursor-pointer hover:bg-secondary/30 transition-colors',
                  isToday && 'bg-accent/5',
                  isSelected && 'ring-2 ring-accent ring-inset'
                )}
              >
                <span className={cn(
                  'inline-flex w-6 h-6 md:w-7 md:h-7 items-center justify-center rounded-full text-xs md:text-sm',
                  isToday && 'bg-accent text-accent-foreground font-medium'
                )}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-0.5 md:space-y-1">
                  {dayAppointments.slice(0, isMobile ? 1 : 2).map((apt) => (
                    <div 
                      key={apt.id} 
                      className="px-1 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs rounded bg-accent/10 text-accent truncate"
                    >
                      {isMobile ? '•' : apt.title}
                    </div>
                  ))}
                  {dayAppointments.length > (isMobile ? 1 : 2) && (
                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      +{dayAppointments.length - (isMobile ? 1 : 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayDetail && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          appointments={getAppointmentsForDay(selectedDate)}
          clients={clients}
          onClose={() => { setShowDayDetail(false); setSelectedDate(null); }}
          onCreateNew={() => { setShowForm(true); setShowDayDetail(false); setEditingAppointment(null); }}
          onEdit={handleEditClick}
          onDelete={handleDeleteAppointment}
          getTypeLabel={getTypeLabel}
          getTypeIcon={getTypeIcon}
          isDeleting={deleteAppointment.isPending}
        />
      )}

      {/* Appointment Form Modal */}
      {showForm && selectedDate && (
        <AppointmentForm 
          date={selectedDate} 
          clients={clients} 
          appointment={editingAppointment}
          onSubmit={editingAppointment ? handleUpdateAppointment : handleCreateAppointment} 
          onClose={() => { setShowForm(false); setShowDayDetail(true); setEditingAppointment(null); }} 
          isLoading={createAppointment.isPending || updateAppointment.isPending} 
        />
      )}
    </div>
  );
}

interface DayDetailModalProps {
  date: Date;
  appointments: any[];
  clients: any[];
  onClose: () => void;
  onCreateNew: () => void;
  onEdit: (apt: AppointmentData) => void;
  onDelete: (id: string) => void;
  getTypeLabel: (type: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  isDeleting: boolean;
}

function DayDetailModal({ date, appointments, clients, onClose, onCreateNew, onEdit, onDelete, getTypeLabel, getTypeIcon, isDeleting }: DayDetailModalProps) {
  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find((c: any) => c.id === clientId);
    return client?.name || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 animate-fade-in">
      <div className="w-full md:max-w-lg bg-card rounded-t-xl md:rounded-xl shadow-dramatic max-h-[85vh] overflow-hidden safe-area-bottom flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div>
            <h3 className="font-display text-lg font-semibold">
              {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-sm text-muted-foreground">
              {appointments.length === 0 
                ? 'Nenhum compromisso' 
                : `${appointments.length} compromisso${appointments.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum compromisso agendado para este dia.</p>
              <Button onClick={onCreateNew} className="gradient-gold">
                <Plus className="w-4 h-4 mr-2" />
                Agendar Compromisso
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .map((apt) => {
                  const clientName = getClientName(apt.client_id);
                  return (
                    <div 
                      key={apt.id} 
                      className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                              {getTypeIcon(apt.type)}
                              {getTypeLabel(apt.type)}
                            </span>
                          </div>
                          <h4 className="font-medium text-foreground truncate">{apt.title}</h4>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                              </span>
                            </div>
                            
                            {clientName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{clientName}</span>
                              </div>
                            )}
                            
                            {apt.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{apt.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => onEdit(apt)}
                            className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                            title="Editar compromisso"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(apt.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Excluir compromisso"
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

        {/* Footer */}
        {appointments.length > 0 && (
          <div className="p-4 md:p-6 border-t border-border">
            <Button onClick={onCreateNew} className="w-full gradient-gold">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Compromisso
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface AppointmentFormProps {
  date: Date;
  clients: any[];
  appointment?: AppointmentData | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

function AppointmentForm({ date, clients, appointment, onSubmit, onClose, isLoading }: AppointmentFormProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState('visit');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');

  const isEditing = !!appointment;

  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title);
      setClientId(appointment.client_id || '');
      setType(appointment.type);
      setStartTime(format(new Date(appointment.start_time), 'HH:mm'));
      setEndTime(format(new Date(appointment.end_time), 'HH:mm'));
      setLocation(appointment.location || '');
    } else {
      setTitle('');
      setClientId('');
      setType('visit');
      setStartTime('10:00');
      setEndTime('11:00');
      setLocation('');
    }
  }, [appointment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appointmentDate = appointment ? new Date(appointment.start_time) : date;
    const start = new Date(appointmentDate);
    const [sh, sm] = startTime.split(':');
    start.setHours(parseInt(sh), parseInt(sm), 0, 0);
    const end = new Date(appointmentDate);
    const [eh, em] = endTime.split(':');
    end.setHours(parseInt(eh), parseInt(em), 0, 0);

    const data = { 
      title, 
      client_id: clientId || undefined, 
      start_time: start.toISOString(), 
      end_time: end.toISOString(), 
      type, 
      location: location || undefined 
    };

    if (isEditing && appointment) {
      onSubmit({ ...data, id: appointment.id });
    } else {
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 animate-fade-in">
      <div className="w-full md:max-w-md bg-card rounded-t-xl md:rounded-xl shadow-dramatic p-4 md:p-6 max-h-[90vh] overflow-y-auto safe-area-bottom">
        <h3 className="font-display text-lg font-semibold mb-4">
          {isEditing ? 'Editar Compromisso' : 'Novo Compromisso'} - {format(appointment ? new Date(appointment.start_time) : date, "dd 'de' MMM", { locale: ptBR })}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Título do compromisso" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            className="w-full px-3 py-3 rounded-lg border border-border bg-background text-base" 
          />
          <select 
            value={clientId} 
            onChange={(e) => setClientId(e.target.value)} 
            className="w-full px-3 py-3 rounded-lg border border-border bg-background text-base"
          >
            <option value="">Selecionar cliente (opcional)</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)} 
            className="w-full px-3 py-3 rounded-lg border border-border bg-background text-base"
          >
            <option value="visit">Visita</option>
            <option value="meeting">Reunião</option>
            <option value="call">Ligação</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Início</label>
              <input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                className="w-full px-3 py-3 rounded-lg border border-border bg-background text-base" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Término</label>
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                className="w-full px-3 py-3 rounded-lg border border-border bg-background text-base" 
              />
            </div>
          </div>
          <input 
            type="text" 
            placeholder="Local (opcional)" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            className="w-full px-3 py-3 rounded-lg border border-border bg-background text-base" 
          />
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 rounded-lg border border-border font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !title} 
              className="flex-1 py-3 rounded-lg gradient-gold text-white font-medium disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isEditing ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
