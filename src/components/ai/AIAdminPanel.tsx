import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAdmin } from '@/hooks/useAI';
import { toast } from 'sonner';
import { 
  Bot, 
  MessageSquare, 
  Building2, 
  Brain, 
  RefreshCw, 
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp
} from 'lucide-react';

export function AIAdminPanel() {
  const { 
    isLoading, 
    getStats, 
    getConversations, 
    getLearnings, 
    approveLearning, 
    rejectLearning,
    testChat,
    syncProperties
  } = useAIAdmin();

  const [stats, setStats] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [learnings, setLearnings] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [statsData, conversationsData, learningsData] = await Promise.all([
      getStats(),
      getConversations(),
      getLearnings(),
    ]);

    if (statsData) setStats(statsData);
    setConversations(conversationsData);
    setLearnings(learningsData);
  };

  const handleTestChat = async () => {
    if (!testMessage.trim()) return;
    
    const response = await testChat(testMessage);
    if (response) {
      setTestResponse(response);
      toast.success('Teste realizado com sucesso!');
    } else {
      toast.error('Erro ao testar chat');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncProperties();
    setSyncing(false);
    
    if (result?.success) {
      toast.success(`Sincronização concluída: ${result.stats.inserted} novos, ${result.stats.updated} atualizados`);
      loadData();
    } else {
      toast.error('Erro na sincronização');
    }
  };

  const handleApproveLearning = async (id: string) => {
    const success = await approveLearning(id);
    if (success) {
      toast.success('Aprendizado aprovado!');
      setLearnings(prev => prev.filter(l => l.id !== id));
    } else {
      toast.error('Erro ao aprovar');
    }
  };

  const handleRejectLearning = async (id: string) => {
    const success = await rejectLearning(id);
    if (success) {
      toast.success('Aprendizado rejeitado');
      setLearnings(prev => prev.filter(l => l.id !== id));
    } else {
      toast.error('Erro ao rejeitar');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Privus AI Assistente
          </h1>
          <p className="text-muted-foreground">Painel de administração do motor de IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            Sincronizar Imóveis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversations?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.conversations?.active || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversations?.qualifiedLeads || 0}</div>
            <p className="text-xs text-muted-foreground">Score ≥ 60</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imóveis</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.properties?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.properties?.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprendizados</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.learnings?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">pendentes de aprovação</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Testar IA</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="learnings">Aprendizados</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulador de Chat</CardTitle>
              <CardDescription>
                Teste o comportamento da IA com mensagens simuladas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma mensagem para testar..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                />
                <Button onClick={handleTestChat} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {testResponse && (
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Resposta da IA:</p>
                    <p className="whitespace-pre-wrap">{testResponse.message}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">Interesses Extraídos:</p>
                      <pre className="text-sm">
                        {JSON.stringify(testResponse.extractedInterests, null, 2)}
                      </pre>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">Qualificação:</p>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold">
                          {testResponse.qualificationScore}
                        </div>
                        <span className="text-muted-foreground">/100</span>
                        <Badge variant={testResponse.qualificationScore >= 60 ? 'default' : 'secondary'}>
                          {testResponse.qualificationScore >= 80 ? 'Quente' : 
                           testResponse.qualificationScore >= 60 ? 'Morno' : 'Frio'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
              <CardDescription>
                Histórico de conversas com leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma conversa encontrada
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {conv.phone || conv.session_id.slice(0, 20)}...
                            </span>
                            <Badge variant="outline">{conv.platform}</Badge>
                            {conv.lead_qualified && (
                              <Badge variant="default">Qualificado</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Score: {conv.qualification_score}/100 • 
                            {new Date(conv.updated_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge
                          variant={conv.status === 'active' ? 'default' : 'secondary'}
                        >
                          {conv.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learnings">
          <Card>
            <CardHeader>
              <CardTitle>Aprendizados Pendentes</CardTitle>
              <CardDescription>
                Perguntas frequentes e padrões identificados para aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {learnings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum aprendizado pendente
                    </p>
                  ) : (
                    learnings.map((learning) => (
                      <div
                        key={learning.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{learning.tipo}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Frequência: {learning.frequencia}
                          </span>
                        </div>
                        
                        {learning.pergunta && (
                          <div>
                            <p className="text-sm font-medium">Pergunta:</p>
                            <p className="text-sm text-muted-foreground">
                              {learning.pergunta}
                            </p>
                          </div>
                        )}
                        
                        {learning.resposta && (
                          <div>
                            <p className="text-sm font-medium">Resposta:</p>
                            <p className="text-sm text-muted-foreground">
                              {learning.resposta}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveLearning(learning.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectLearning(learning.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
