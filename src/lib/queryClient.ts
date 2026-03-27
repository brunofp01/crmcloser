import { QueryClient } from '@tanstack/react-query';

/**
 * Configuração otimizada do QueryClient para:
 * - Evitar refetch desnecessário em focus (realtime cuida disso)
 * - Manter dados fresh por 30 segundos
 * - Garbage collection após 5 minutos
 * - Retry automático com backoff
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados são considerados "fresh" por 30 segundos
      // Evita refetches desnecessários durante interações rápidas
      staleTime: 30 * 1000,
      
      // Cache mantido por 5 minutos após última utilização
      gcTime: 5 * 60 * 1000,
      
      // Desabilitar refetch automático no focus (realtime cuida disso)
      refetchOnWindowFocus: false,
      
      // Retry com backoff exponencial para erros de rede
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Manter dados anteriores durante refetch para UX suave
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      // Retry para mutações também
      retry: 1,
      retryDelay: 1000,
    },
  },
});
