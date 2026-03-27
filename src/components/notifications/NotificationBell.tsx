import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg hover:bg-secondary transition-colors",
        className
      )}
    >
      <Bell className="w-5 h-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-medium bg-accent text-accent-foreground rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
