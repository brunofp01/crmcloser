import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message: string;
  extractedInterests: Record<string, unknown>;
  qualificationScore: number;
  sessionId: string;
}

interface AIStats {
  conversations: {
    total: number;
    active: number;
    qualifiedLeads: number;
  };
  properties: {
    total: number;
    active: number;
  };
  learnings: {
    pending: number;
  };
}

interface AIConversation {
  id: string;
  session_id: string;
  phone: string | null;
  platform: string;
  lead_qualified: boolean;
  qualification_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AILearning {
  id: string;
  tipo: string;
  pergunta: string | null;
  resposta: string | null;
  frequencia: number;
  status: string;
  created_at: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `web_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const sendMessage = async (content: string): Promise<AIResponse | null> => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content }]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content,
          sessionId,
          platform: 'web',
        },
      });

      if (error) throw error;

      const aiMessage = data.message;
      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);

      return data as AIResponse;
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' },
      ]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    clearChat,
  };
}

export function useAIAdmin() {
  const [isLoading, setIsLoading] = useState(false);

  const getStats = async (): Promise<AIStats | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai', {
        body: { action: 'get_stats' },
      });

      if (error) throw error;
      return data.stats;
    } catch (error) {
      console.error('Get stats error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getConversations = async (): Promise<AIConversation[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai', {
        body: { action: 'get_conversations' },
      });

      if (error) throw error;
      return data.conversations || [];
    } catch (error) {
      console.error('Get conversations error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getLearnings = async (): Promise<AILearning[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai', {
        body: { action: 'get_learnings' },
      });

      if (error) throw error;
      return data.learnings || [];
    } catch (error) {
      console.error('Get learnings error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const approveLearning = async (id: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-ai', {
        body: { action: 'approve_learning', sessionId: id },
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('Approve learning error:', error);
      return false;
    }
  };

  const rejectLearning = async (id: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-ai', {
        body: { action: 'reject_learning', sessionId: id },
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('Reject learning error:', error);
      return false;
    }
  };

  const testChat = async (message: string): Promise<AIResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai', {
        body: { action: 'test_chat', message },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Test chat error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncProperties = async (source: 'privus' | 'blow' | 'all' = 'all') => {
    setIsLoading(true);
    try {
      const results: { privus?: unknown; blow?: unknown } = {};
      
      // Sync Privus (XML feed)
      if (source === 'privus' || source === 'all') {
        const { data: privusData, error: privusError } = await supabase.functions.invoke('sync-feed', {
          body: {},
        });
        if (privusError) {
          console.error('Privus sync error:', privusError);
        }
        results.privus = privusData;
      }
      
      // Sync Blow (web scraping)
      if (source === 'blow' || source === 'all') {
        const { data: blowData, error: blowError } = await supabase.functions.invoke('sync-blow', {
          body: {},
        });
        if (blowError) {
          console.error('Blow sync error:', blowError);
        }
        results.blow = blowData;
      }
      
      return { 
        success: true, 
        results,
        stats: {
          inserted: ((results.privus as any)?.stats?.inserted || 0) + ((results.blow as any)?.stats?.inserted || 0),
          updated: ((results.privus as any)?.stats?.updated || 0) + ((results.blow as any)?.stats?.updated || 0),
          deactivated: ((results.privus as any)?.stats?.deactivated || 0) + ((results.blow as any)?.stats?.deactivated || 0),
        },
        skipped: (results.privus as any)?.skipped && !(results.blow as any)?.stats,
      };
    } catch (error) {
      console.error('Sync properties error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const syncBlowProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-blow', {
        body: {},
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Blow sync error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getStats,
    getConversations,
    getLearnings,
    approveLearning,
    rejectLearning,
    testChat,
    syncProperties,
    syncBlowProperties,
  };
}
