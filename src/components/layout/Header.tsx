import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNotificationsClick: () => void;
}

export function Header({ title, subtitle, onNotificationsClick }: HeaderProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="w-64 pl-9 bg-secondary/50 border-transparent focus:border-accent"
          />
        </div>

        {/* Notifications */}
        <NotificationBell onClick={onNotificationsClick} />

        {/* User */}
        <button onClick={() => navigate('/profile')} className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-opacity cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{profile?.full_name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{profile?.role === 'master' ? 'Administrador' : 'Corretor'}</p>
          </div>
          <Avatar className="w-9 h-9 border-2 border-accent/30">
            <AvatarImage src={profile?.avatar_url || undefined} alt="Foto de perfil" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(profile?.full_name || 'U')}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
