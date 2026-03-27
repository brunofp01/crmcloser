import { cn } from '@/lib/utils';
import { useIsMaster } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import {
  LayoutDashboard, Users, Menu, X, UserPlus, Settings, Bell,
  BarChart3, UsersRound, LogOut, Building2, UserCircle, ClipboardList, Landmark, Building, Globe,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '@/assets/closer-logo.png';

interface MobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const bottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'new-client', label: 'Novo', icon: UserPlus, highlight: true },
  { id: 'deals', label: 'Imóveis', icon: Building2 },
  { id: 'owners', label: 'Proprietários', icon: Landmark },
];

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMaster = useIsMaster();
  const { signOut } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount);
      } else {
        (navigator as any).clearAppBadge();
      }
    }
  }, [unreadCount]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deals', label: 'Imóveis', icon: Building2 },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'owners', label: 'Proprietários', icon: Landmark },
    { id: 'tasks', label: 'Tarefas', icon: ClipboardList },
    { id: 'lancamentos', label: 'Lançamentos', icon: Building },
    { id: 'anuncios', label: 'Anúncios', icon: Globe },
    { id: 'notifications', label: 'Notificações', icon: Bell, badge: unreadCount },
    ...(isMaster ? [{ id: 'users', label: 'Usuários', icon: UsersRound }] : []),
    { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
  ];

  const handleNavigation = (view: string) => {
    onViewChange(view);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => handleNavigation('dashboard')} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logo} alt="CLOSER" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold text-sidebar-foreground">CLOSER</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => handleNavigation('notifications')} className="relative p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-medium bg-accent text-accent-foreground rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <nav className="md:hidden fixed top-14 right-0 bottom-0 w-64 bg-sidebar z-50 animate-slide-in-right overflow-y-auto">
            <div className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button key={item.id} onClick={() => handleNavigation(item.id)}
                    className={cn('w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all',
                      isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50')}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                      <span className="min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[10px] font-medium bg-accent text-accent-foreground rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="border-t border-sidebar-border my-4" />
              <button onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isHighlight = item.highlight;
            return (
              <button key={item.id} onClick={() => handleNavigation(item.id)}
                className={cn('flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]',
                  isHighlight && 'relative -mt-4',
                  isActive && !isHighlight && 'text-accent',
                  !isActive && !isHighlight && 'text-muted-foreground')}>
                {isHighlight ? (
                  <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center shadow-lg">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <>
                    <Icon className={cn('w-5 h-5', isActive && 'text-accent')} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
