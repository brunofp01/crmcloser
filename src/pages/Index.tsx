import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { ClientDetail } from '@/components/clients/ClientDetail';
import { NewClientForm } from '@/components/clients/NewClientForm';
import { TasksPage } from '@/components/tasks/TasksPage';
import { UserManagement } from '@/components/users/UserManagement';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';
import { DealsPage } from '@/components/deals/DealsPage';
import { NewDealForm } from '@/components/deals/NewDealForm';
import { DealDetail } from '@/components/deals/DealDetail';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { OwnersPage, Owner } from '@/components/owners/OwnersPage';
import { OwnerDetail } from '@/components/owners/OwnerDetail';
import { LancamentosPage } from '@/components/lancamentos/LancamentosPage';
import { LancamentoDetail } from '@/components/lancamentos/LancamentoDetail';
import { NewLancamentoForm } from '@/components/lancamentos/NewLancamentoForm';
import { AnunciosPage } from '@/components/anuncios/AnunciosPage';
import { SubscribersPage } from '@/components/users/SubscribersPage';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';
import { Client } from '@/types/client';
import { DealWithClients } from '@/types/deal';
import { Lancamento } from '@/hooks/useLancamentos';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AuthPage } from '@/pages/AuthPage';
import { WaitingActivation } from '@/components/auth/WaitingActivation';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const viewTitles: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do seu pipeline de vendas' },
  deals: { title: 'Imóveis', subtitle: 'Gerencie seus imóveis' },
  clients: { title: 'Clientes', subtitle: 'Gerencie seus clientes' },
  owners: { title: 'Proprietários', subtitle: 'Proprietários dos seus imóveis' },
  tasks: { title: 'Tarefas', subtitle: 'Gerencie suas tarefas e lembretes' },
  lancamentos: { title: 'Lançamentos', subtitle: 'Empreendimentos de construtoras' },
  anuncios: { title: 'Imóveis de Anúncios', subtitle: 'Busque anúncios em tempo real no Zap Imóveis' },
  users: { title: 'Usuários', subtitle: 'Gerencie os usuários do sistema' },
  subscribers: { title: 'Assinantes', subtitle: 'Gestão de assinaturas e pagamentos' },
  notifications: { title: 'Notificações', subtitle: 'Suas notificações e lembretes' },
  profile: { title: 'Meu Perfil', subtitle: 'Gerencie suas informações pessoais' },
};

const pathToView: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/deals': 'deals',
  '/clients': 'clients',
  '/owners': 'owners',
  '/tasks': 'tasks',
  '/lancamentos': 'lancamentos',
  '/anuncios': 'anuncios',
  '/users': 'users',
  '/subscribers': 'subscribers',
  '/notifications': 'notifications',
  '/profile': 'profile',
};

const Index = () => {
  const { user, loading } = useAuth();
  const { data: roleData, isLoading: isRoleLoading } = useUserRole();
  const isMaster = roleData?.isMaster ?? false;
  const subscriptionStatus = roleData?.subscriptionStatus ?? 'pending';
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = pathToView[location.pathname] || 'dashboard';
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealWithClients | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [showNewLancamentoForm, setShowNewLancamentoForm] = useState(false);
  const [topPanel, setTopPanel] = useState<'client' | 'deal'>('client');

  const openClient = (client: Client | null) => {
    setSelectedClient(client);
    if (client) setTopPanel('client');
  };
  const openDeal = (deal: DealWithClients | null) => {
    setSelectedDeal(deal);
    if (deal) setTopPanel('deal');
  };
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top when changing pages
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeView]);

  if (loading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Guard for subscription activation
  if (!isMaster && subscriptionStatus !== 'active') {
    return <WaitingActivation />;
  }

  const handleViewChange = (view: string) => {
    if (view === 'new-client') {
      setShowNewClientForm(true);
    } else if (view === 'new-deal') {
      setShowNewDealForm(true);
    } else if (view === 'new-lancamento') {
      setShowNewLancamentoForm(true);
    } else if (['users', 'subscribers'].includes(view) && !isMaster) {
      return;
    } else {
      navigate(`/${view}`);
    }
  };

  const { title, subtitle } = viewTitles[activeView] || { title: 'CLOSER CRM' };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onClientSelect={openClient} />;
      case 'deals':
        return <DealsPage onDealSelect={openDeal} onNewDeal={() => setShowNewDealForm(true)} />;
      case 'clients':
        return <ClientsPage onClientSelect={openClient} />;
      case 'owners':
        return <OwnersPage onOwnerSelect={setSelectedOwner} />;
      case 'tasks':
        return <TasksPage onClientSelect={openClient} />;
      case 'lancamentos':
        return <LancamentosPage onSelect={setSelectedLancamento} onNew={() => setShowNewLancamentoForm(true)} />;
      case 'anuncios':
        return <AnunciosPage />;
      case 'users':
        return <UserManagement />;
      case 'subscribers':
        return <SubscribersPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {!isMobile && <Sidebar activeView={activeView} onViewChange={handleViewChange} />}
      {isMobile && <MobileNav activeView={activeView} onViewChange={handleViewChange} />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isMobile && (
          <Header title={title} subtitle={subtitle} onNotificationsClick={() => navigate('/notifications')} />
        )}
        <main ref={mainRef} className={`flex-1 overflow-auto overscroll-contain ${isMobile ? 'pt-14 mobile-content-padding' : ''}`}>
          {renderContent()}
        </main>
      </div>
      
      {selectedClient && (
        <ClientDetail 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
          onDealSelect={(deal) => { setSelectedDeal(deal); setTopPanel('deal'); }}
          zIndex={topPanel === 'client' ? 60 : 50}
        />
      )}
      {selectedDeal && (
        <DealDetail 
          deal={selectedDeal} 
          onClose={() => setSelectedDeal(null)} 
          onClientSelect={(client) => { setSelectedClient(client); setTopPanel('client'); }}
          zIndex={topPanel === 'deal' ? 60 : 50}
        />
      )}
      {selectedOwner && <OwnerDetail owner={selectedOwner} onClose={() => setSelectedOwner(null)} />}
      {selectedLancamento && <LancamentoDetail lancamento={selectedLancamento} onClose={() => setSelectedLancamento(null)} onClientSelect={openClient} />}
      {showNewClientForm && <NewClientForm onClose={() => setShowNewClientForm(false)} />}
      {showNewDealForm && <NewDealForm onClose={() => setShowNewDealForm(false)} />}
      {showNewLancamentoForm && <NewLancamentoForm onClose={() => setShowNewLancamentoForm(false)} />}
      
      <InstallPrompt />
      <PushNotificationPrompt />
    </div>
  );
};

export default Index;
