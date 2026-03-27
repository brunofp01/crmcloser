import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BLPYvxB68N0q3Q7m3zN1yzJfWz9hzF6kTGjKqEK8rQH6kXg2RlKMHcO4wO_VJxY4ghFvxKnJZVsHzqkJBFH6VNM';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Check for existing subscription
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await (registration as any).pushManager.getSubscription();
      setSubscription(existingSub);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações push não são suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificações ativadas com sucesso!');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão de notificação negada');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;
    
    setIsLoading(true);
    
    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return false;
        }
      } else if (Notification.permission === 'denied') {
        toast.error('Notificações foram bloqueadas. Altere nas configurações do navegador.');
        setIsLoading(false);
        return false;
      }

      // Register or get service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const sub = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      setSubscription(sub);

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions' as any)
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(sub.toJSON()),
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving subscription:', error);
      }

      toast.success('Notificações push ativadas!');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar notificações');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription || !user) return false;
    
    setIsLoading(true);

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from database
      await supabase
        .from('push_subscriptions' as any)
        .delete()
        .eq('user_id', user.id);

      toast.success('Notificações push desativadas');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
      setIsLoading(false);
      return false;
    }
  }, [subscription, user]);

  const showLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    isSubscribed: !!subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}
