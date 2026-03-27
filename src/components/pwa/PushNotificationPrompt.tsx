import { useState, useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isSupported, permission, isSubscribed, subscribe, isLoading } = usePushNotifications();

  useEffect(() => {
    // Only show prompt if:
    // 1. Push notifications are supported
    // 2. User hasn't granted or denied permission yet
    // 3. User hasn't subscribed
    // 4. App is installed as PWA (standalone mode)
    // 5. User hasn't dismissed the prompt recently
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissedAt = localStorage.getItem('push-prompt-dismissed');
    const daysSinceDismiss = dismissedAt 
      ? (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (
      isSupported && 
      permission === 'default' && 
      !isSubscribed && 
      isStandalone && 
      daysSinceDismiss > 7
    ) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, isSubscribed]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 animate-slide-up sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md">
      <div className="bg-card border border-border rounded-xl shadow-dramatic p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">Ativar notificações</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Receba lembretes sobre seus compromissos agendados.
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 py-2 px-4 rounded-lg gradient-gold text-white text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? 'Ativando...' : 'Ativar'}
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Depois
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
