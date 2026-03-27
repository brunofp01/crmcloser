import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { MarkdownMessage } from '@/components/ai/MarkdownMessage';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Send,
  Phone,
  MoreVertical,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Sparkles,
  Filter,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  session_id: string;
  phone: string | null;
  platform: string;
  status: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  client_id: string | null;
  extracted_interests: any;
  lead_qualified: boolean;
  qualification_score: number;
  ai_enabled: boolean;
}

type PlatformFilter = 'all' | 'whatsapp' | 'instagram' | 'web';

// Platform config
const platformConfig: Record<string, { icon: string; color: string; name: string; bgColor: string }> = {
  whatsapp: { icon: '📱', color: 'bg-green-500', name: 'WhatsApp', bgColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  instagram: { icon: '📸', color: 'bg-gradient-to-br from-purple-500 to-pink-500', name: 'Instagram', bgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  web: { icon: '🌐', color: 'bg-blue-500', name: 'Web', bgColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const parsedData = (data || []).map(conv => ({
        ...conv,
        messages: typeof conv.messages === 'string'
          ? JSON.parse(conv.messages)
          : (conv.messages || [])
      }));

      setConversations(parsedData);

      if (selectedConversation) {
        const updated = parsedData.find(c => c.id === selectedConversation.id);
        if (updated) setSelectedConversation(updated);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: message.trim(),
          sessionId: selectedConversation.session_id,
          phone: selectedConversation.phone,
          platform: selectedConversation.platform,
          aiAutoReply: selectedConversation.ai_enabled,
        },
      });

      if (error) throw error;
      setMessage('');
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleToggleAI = async (conversationId: string, enabled: boolean) => {
    setIsTogglingAI(true);
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ ai_enabled: enabled })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, ai_enabled: enabled } : c
      ));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, ai_enabled: enabled } : null);
      }

      toast({
        title: enabled ? "🤖 IA Ativada" : "👤 Modo Manual",
        description: enabled
          ? "A IA responderá automaticamente nesta conversa"
          : "Você responderá manualmente nesta conversa",
      });
    } catch (error) {
      console.error('Error toggling AI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o modo da IA",
        variant: "destructive",
      });
    } finally {
      setIsTogglingAI(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  // Filters
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    const name = getConversationName(conv).toLowerCase();
    const phone = conv.phone?.toLowerCase() || '';
    const lastMessage = conv.messages?.[conv.messages.length - 1]?.content?.toLowerCase() || '';
    const matchesSearch = name.includes(searchLower) || phone.includes(searchLower) || lastMessage.includes(searchLower);
    const matchesPlatform = platformFilter === 'all' || conv.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const platformCounts = {
    all: conversations.length,
    whatsapp: conversations.filter(c => c.platform === 'whatsapp').length,
    instagram: conversations.filter(c => c.platform === 'instagram').length,
    web: conversations.filter(c => c.platform === 'web').length,
  };

  function getConversationName(conv: Conversation) {
    if (conv.extracted_interests?.nomeCliente) {
      return conv.extracted_interests.nomeCliente;
    }
    return conv.phone || `Conversa ${conv.session_id.substring(0, 8)}`;
  }

  function getConversationPreview(conv: Conversation) {
    const lastMessage = conv.messages?.[conv.messages.length - 1];
    if (!lastMessage) return 'Sem mensagens';
    const prefix = lastMessage.role === 'assistant' ? '🤖 ' : '';
    const content = lastMessage.content.substring(0, 40);
    return prefix + content + (lastMessage.content.length > 40 ? '...' : '');
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  // ========== CONVERSATION LIST ==========
  const ConversationList = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg border border-border transition-colors",
              showFilters && "bg-accent/10 border-accent"
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        {/* Platform Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {(['all', 'whatsapp', 'instagram', 'web'] as PlatformFilter[]).map((platform) => {
              const isActive = platformFilter === platform;
              const config = platform === 'all' ? null : platformConfig[platform];
              const count = platformCounts[platform];

              return (
                <button
                  key={platform}
                  onClick={() => setPlatformFilter(platform)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    isActive
                      ? platform === 'all'
                        ? 'bg-accent text-accent-foreground'
                        : config?.bgColor
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  )}
                >
                  {config && <span className="text-sm">{config.icon}</span>}
                  <span>{platform === 'all' ? 'Todas' : config?.name}</span>
                  <span className={cn(
                    'ml-1 px-1.5 rounded-full text-[10px]',
                    isActive ? 'bg-white/20' : 'bg-muted'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma conversa</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {platformFilter !== 'all'
                ? `Sem conversas do ${platformConfig[platformFilter]?.name}`
                : 'Aguardando novos contatos'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => {
              const platform = platformConfig[conv.platform] || platformConfig.web;
              const isSelected = selectedConversation?.id === conv.id;
              const hasUnread = conv.messages?.length > 0 && conv.messages[conv.messages.length - 1]?.role === 'user';

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-secondary/50 active:bg-secondary',
                    isSelected && 'bg-accent/10'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(getConversationName(conv))}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-card',
                      platform.color
                    )}>
                      {platform.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "font-medium text-foreground truncate",
                        hasUnread && "font-semibold"
                      )}>
                        {getConversationName(conv)}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm truncate mt-0.5",
                      hasUnread ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {getConversationPreview(conv)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* AI Status Indicator */}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1',
                        conv.ai_enabled
                          ? 'bg-accent/15 text-accent'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      )}>
                        <Sparkles className="w-2.5 h-2.5" />
                        {conv.ai_enabled ? 'IA' : 'Manual'}
                      </span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        conv.lead_qualified
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-secondary text-muted-foreground'
                      )}>
                        {conv.lead_qualified ? '✓ Qualificado' : 'Em andamento'}
                      </span>
                      {conv.qualification_score > 0 && (
                        <span className="text-[10px] text-accent font-medium">
                          {conv.qualification_score}pts
                        </span>
                      )}
                    </div>
                  </div>

                  {hasUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0 mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ========== CHAT VIEW ==========
  const ChatView = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-secondary/20 p-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Suas conversas</h3>
          <p className="text-muted-foreground text-center text-sm max-w-xs">
            Selecione uma conversa para visualizar e responder mensagens
          </p>
        </div>
      );
    }

    const platform = platformConfig[selectedConversation.platform] || platformConfig.web;
    const messages = selectedConversation.messages || [];

    return (
      <div className="flex-1 flex flex-col bg-background min-h-0">
        {/* Chat Header */}
        <div className="flex-shrink-0 h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 -ml-2"
                onClick={() => setSelectedConversation(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border border-border flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                {getInitials(getConversationName(selectedConversation))}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                {getConversationName(selectedConversation)}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', platform.color)} />
                <span className="truncate">
                  {platform.name}
                  {selectedConversation.phone && !isMobile && ` • ${selectedConversation.phone}`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* AI Toggle - Per Conversation */}
            <button
              onClick={() => handleToggleAI(selectedConversation.id, !selectedConversation.ai_enabled)}
              disabled={isTogglingAI}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all',
                selectedConversation.ai_enabled
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {isTogglingAI ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>{selectedConversation.ai_enabled ? 'IA Ativa' : 'Manual'}</span>
            </button>

            {selectedConversation.phone && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => openWhatsApp(selectedConversation.phone!)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" asChild>
                  <a href={`tel:${selectedConversation.phone}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-3 sm:p-4"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        >
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Início da conversa</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const showTimestamp = index === 0 || 
                  (messages[index - 1]?.role !== msg.role);

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      isUser ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 shadow-sm',
                        isUser
                          ? 'bg-accent text-accent-foreground rounded-br-md'
                          : 'bg-card border border-border rounded-bl-md'
                      )}
                    >
                      {/* Message Content */}
                      {isUser ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <div className="text-sm">
                          <MarkdownMessage content={msg.content} />
                        </div>
                      )}

                      {/* Timestamp & Actions */}
                      <div className={cn(
                        'flex items-center gap-1 mt-1',
                        isUser ? 'justify-end' : 'justify-between'
                      )}>
                        <span className="text-[10px] opacity-60">
                          {msg.timestamp || formatTime(selectedConversation.updated_at)}
                        </span>
                        {isUser && (
                          <CheckCheck className="w-3 h-3 opacity-60" />
                        )}
                      </div>

                      {/* Copy Button */}
                      {!isUser && (
                        <button
                          onClick={() => handleCopyMessage(msg.content, index)}
                          className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 max-w-2xl mx-auto"
          >
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedConversation.ai_enabled ? "A IA responderá..." : "Digite sua mensagem..."}
                className="pr-10 min-h-[44px] resize-none"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 rounded-full flex-shrink-0"
              disabled={!message.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-7.5rem)] flex flex-col">
        {selectedConversation ? <ChatView /> : <ConversationList />}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-80 lg:w-96 border-r border-border flex-shrink-0">
        <ConversationList />
      </div>
      <ChatView />
    </div>
  );
}
