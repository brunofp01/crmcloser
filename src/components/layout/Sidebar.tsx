import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMaster } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/closer-logo.png';
import {
  LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight,
  UserPlus, Bell, LogOut, Building2, ClipboardList, Landmark, Building,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isMaster = useIsMaster();
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deals', label: 'Imóveis', icon: Building2 },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'owners', label: 'Proprietários', icon: Landmark },
    { id: 'tasks', label: 'Tarefas', icon: ClipboardList },
    { id: 'lancamentos', label: 'Lançamentos', icon: Building },
    ...(isMaster ? [{ id: 'users', label: 'Usuários', icon: Settings }] : []),
  ];

  const bottomItems = [
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className={cn('h-screen bg-sidebar flex flex-col transition-all duration-300 ease-in-out', collapsed ? 'w-20' : 'w-64')}>
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <button onClick={() => onViewChange('dashboard')} className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="w-10 h-10 rounded-lg overflow-hidden">
            <img src={logo} alt="CLOSER" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in text-left">
              <h1 className="font-display text-lg font-semibold text-sidebar-foreground">CLOSER</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Negócios Imobiliários</p>
            </div>
          )}
        </button>
      </div>

      {/* New Client Button */}
      <div className="p-4">
        <button onClick={() => onViewChange('new-client')}
          className={cn('w-full flex items-center justify-center gap-2 py-3 rounded-lg gradient-gold text-white font-medium transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]',
            collapsed ? 'px-3' : 'px-4')}>
          <UserPlus className="w-5 h-5" />
          {!collapsed && <span>Novo Cliente</span>}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button onClick={() => onViewChange(item.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    collapsed && 'justify-center')}>
                  <Icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary')} />
                  {!collapsed && <span className="font-medium animate-fade-in">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Items */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <ul className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button onClick={() => onViewChange(item.id)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    collapsed && 'justify-center')}>
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium animate-fade-in">{item.label}</span>}
                </button>
              </li>
            );
          })}
          <li>
            <button onClick={() => signOut()}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'text-destructive hover:bg-destructive/10', collapsed && 'justify-center')}>
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="font-medium animate-fade-in">Sair</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* Collapse Button */}
      <div className="p-3 border-t border-sidebar-border">
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
