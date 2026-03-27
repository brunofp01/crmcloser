import { 
  Bell, 
  Calendar, 
  User, 
  Settings2, 
  Check, 
  Trash2, 
  BellOff, 
  BellRing,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
  Notification 
} from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    isLoading: pushLoading,
    subscribe,
    unsubscribe 
  } = usePushNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'client':
        return <User className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
  };

  const togglePushNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
            Notificações
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Marcar todas como lidas</span>
            </button>
          )}
        </div>
      </div>

      {/* Push Notifications Settings */}
      <div className="card-elevated p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isSubscribed ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            )}>
              {isSubscribed ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-foreground">Notificações Push</p>
              <p className="text-sm text-muted-foreground">
                {!isSupported 
                  ? 'Não suportado neste navegador'
                  : permission === 'denied'
                    ? 'Bloqueado nas configurações do navegador'
                    : isSubscribed 
                      ? 'Ativadas - você receberá lembretes de compromissos'
                      : 'Ative para receber lembretes de compromissos'
                }
              </p>
            </div>
          </div>
          
          {isSupported && permission !== 'denied' && (
            <button
              onClick={togglePushNotifications}
              disabled={pushLoading}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isSubscribed 
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "gradient-gold text-white"
              )}
            >
              {pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                'Desativar'
              ) : (
                'Ativar'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "card-elevated p-4 cursor-pointer transition-colors",
                  !notification.read && "bg-accent/5 border-accent/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    !notification.read ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn(
                          "text-sm",
                          !notification.read ? "font-medium text-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification.mutate(notification.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))}

            {notifications.length > 0 && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => clearAll.mutate()}
                  disabled={clearAll.isPending}
                  className="text-sm text-destructive hover:underline"
                >
                  {clearAll.isPending ? 'Removendo...' : 'Limpar todas as notificações'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
