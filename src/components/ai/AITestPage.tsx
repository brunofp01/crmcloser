import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAIChat } from '@/hooks/useAI';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Coins,
  History,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownMessage } from './MarkdownMessage';
import { toast } from '@/hooks/use-toast';

// Approximate token count (rough estimation)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function AITestPage() {
  const { messages, isLoading, sessionId, sendMessage, clearChat } = useAIChat();
  const [input, setInput] = useState('');
  const [tokenStats, setTokenStats] = useState({ input: 0, output: 0, total: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast({ title: 'Copiado!', description: 'Resposta copiada para a área de transferência' });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Calculate token stats
    let inputTokens = 0;
    let outputTokens = 0;
    
    messages.forEach(msg => {
      const tokens = estimateTokens(msg.content);
      if (msg.role === 'user') {
        inputTokens += tokens;
      } else {
        outputTokens += tokens;
      }
    });

    setTokenStats({
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleQuickTest = (message: string) => {
    setInput(message);
  };

  const quickTests = [
    { label: 'Busca básica', message: 'Procuro um apartamento de 3 quartos no centro' },
    { label: 'Referência histórico', message: 'Gostei do segundo, tem mais informações?' },
    { label: 'Orçamento', message: 'Meu orçamento é de R$ 500.000' },
    { label: 'Urgência', message: 'Preciso me mudar no próximo mês' },
    { label: 'Teste anti-alucinação', message: 'Me fale sobre o Edifício Aurora no bairro imaginário' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Testar IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Simule conversas e teste o comportamento da Privus AI
          </p>
        </div>
        <Button variant="outline" onClick={clearChat} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tokens Input</p>
                <p className="text-lg md:text-xl font-bold">{tokenStats.input}</p>
              </div>
              <Coins className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tokens Output</p>
                <p className="text-lg md:text-xl font-bold">{tokenStats.output}</p>
              </div>
              <Coins className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
                <p className="text-lg md:text-xl font-bold">{tokenStats.total}</p>
              </div>
              <Coins className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mensagens</p>
                <p className="text-lg md:text-xl font-bold">{messages.length}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Simulador de Chat
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Session ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{sessionId.slice(0, 20)}...</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-[300px] md:h-[400px] border rounded-lg p-2 sm:p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 md:py-12">
                    <Bot className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Inicie uma conversa para testar a IA
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use os testes rápidos ao lado ou digite sua própria mensagem
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-3 group',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] sm:max-w-[75%] min-w-0 rounded-lg px-3 py-2 md:px-4 md:py-2 relative overflow-hidden',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <>
                          <MarkdownMessage content={message.content} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-1 -top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm border"
                            onClick={() => handleCopy(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words overflow-hidden overflow-wrap-anywhere">{message.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] opacity-60">
                          ~{estimateTokens(message.content)} tokens
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite uma mensagem para testar..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Tests & History Reference */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Testes Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickTests.map((test, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleQuickTest(test.message)}
                >
                  <div>
                    <p className="font-medium text-xs">{test.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {test.message}
                    </p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Referências de Histórico
              </CardTitle>
              <CardDescription className="text-xs">
                Teste a capacidade da IA de referenciar mensagens anteriores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-2">
                <p className="font-medium">Exemplos de referências:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• "Gostei do segundo imóvel"</li>
                  <li>• "Pode repetir o primeiro?"</li>
                  <li>• "O que você disse sobre valor?"</li>
                  <li>• "Volte ao apartamento anterior"</li>
                </ul>
              </div>
              <Separator />
              <div className="text-xs">
                <p className="font-medium mb-1">Histórico atual:</p>
                <p className="text-muted-foreground">
                  {messages.length} mensagens • {Math.ceil(messages.length / 2)} turnos
                </p>
                <p className="text-muted-foreground">
                  Limite: 20 mensagens (10 turnos)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
