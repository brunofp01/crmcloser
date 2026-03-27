import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Brain, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Edit,
  TrendingUp,
  MessageCircle,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Loader2,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Learning {
  id: string;
  tipo: string;
  pergunta: string | null;
  resposta: string | null;
  contexto: any;
  frequencia: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LearningStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  topQuestions: { pergunta: string; frequencia: number }[];
}

const TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  pergunta_frequente: { label: 'Pergunta Frequente', icon: MessageCircle, color: 'text-blue-500' },
  objecao: { label: 'Objeção', icon: AlertCircle, color: 'text-orange-500' },
  feedback: { label: 'Feedback', icon: TrendingUp, color: 'text-green-500' },
  interesse: { label: 'Interesse', icon: Lightbulb, color: 'text-yellow-500' },
  correcao: { label: 'Correção', icon: Edit, color: 'text-purple-500' },
};

export function AILearningsPage() {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [filteredLearnings, setFilteredLearnings] = useState<Learning[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    topQuestions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [editingLearning, setEditingLearning] = useState<Learning | null>(null);
  const [editedResponse, setEditedResponse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLearnings(activeTab);
  }, [activeTab, learnings]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch all learnings
      const { data: learningsData, error } = await supabase
        .from('aprendizados_ia')
        .select('*')
        .order('frequencia', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const pending = learningsData?.filter((l) => l.status === 'pendente').length || 0;
      const approved = learningsData?.filter((l) => l.status === 'aprovado').length || 0;
      const rejected = learningsData?.filter((l) => l.status === 'rejeitado').length || 0;

      // Get top questions
      const topQuestions = learningsData
        ?.filter((l) => l.pergunta && l.status !== 'rejeitado')
        .slice(0, 5)
        .map((l) => ({ pergunta: l.pergunta!, frequencia: l.frequencia })) || [];

      setLearnings(learningsData || []);
      setStats({
        total: learningsData?.length || 0,
        pending,
        approved,
        rejected,
        topQuestions,
      });
    } catch (error) {
      console.error('Error loading learnings:', error);
      toast.error('Erro ao carregar aprendizados');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLearnings = (status: string) => {
    if (status === 'all') {
      setFilteredLearnings(learnings);
    } else {
      setFilteredLearnings(learnings.filter((l) => l.status === status.replace('ed', 'o').replace('pend', 'pendente').replace('approv', 'aprovad').replace('reject', 'rejeitad')));
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('aprendizados_ia')
        .update({ status: 'aprovado', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Aprendizado aprovado!');
      setLearnings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'aprovado' } : l))
      );
    } catch (error) {
      toast.error('Erro ao aprovar');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('aprendizados_ia')
        .update({ status: 'rejeitado', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Aprendizado rejeitado');
      setLearnings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'rejeitado' } : l))
      );
    } catch (error) {
      toast.error('Erro ao rejeitar');
    }
  };

  const handleEdit = (learning: Learning) => {
    setEditingLearning(learning);
    setEditedResponse(learning.resposta || '');
  };

  const handleSaveEdit = async () => {
    if (!editingLearning) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('aprendizados_ia')
        .update({
          resposta: editedResponse,
          status: 'aprovado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLearning.id);

      if (error) throw error;

      toast.success('Resposta atualizada e aprovada!');
      setLearnings((prev) =>
        prev.map((l) =>
          l.id === editingLearning.id
            ? { ...l, resposta: editedResponse, status: 'aprovado' }
            : l
        )
      );
      setEditingLearning(null);
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return { label: 'Pendente', variant: 'secondary' as const };
      case 'aprovado':
        return { label: 'Aprovado', variant: 'default' as const };
      case 'rejeitado':
        return { label: 'Rejeitado', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'secondary' as const };
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Aprendizados da IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie insights extraídos das conversas
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading} className="w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
              </div>
              <Brain className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aprovados</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rejeitados</p>
                <p className="text-lg md:text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      {stats.topQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Perguntas Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topQuestions.map((q, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <p className="text-sm flex-1 truncate mr-4">{q.pergunta}</p>
                  <Badge variant="outline">{q.frequencia}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learnings List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aprendizados</CardTitle>
          <CardDescription className="text-xs">
            Revise e aprove os insights extraídos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-4 overflow-x-auto">
              <TabsTrigger value="pendente" className="text-xs">
                Pendentes ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="aprovado" className="text-xs">
                Aprovados ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejeitado" className="text-xs">
                Rejeitados ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLearnings.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum aprendizado {activeTab === 'pendente' ? 'pendente' : activeTab === 'aprovado' ? 'aprovado' : 'rejeitado'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredLearnings.map((learning) => {
                    const tipoInfo = TIPO_LABELS[learning.tipo] || {
                      label: learning.tipo,
                      icon: Brain,
                      color: 'text-muted-foreground',
                    };
                    const TipoIcon = tipoInfo.icon;
                    const statusInfo = getStatusLabel(learning.status);

                    return (
                      <Card key={learning.id}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TipoIcon className={`h-4 w-4 ${tipoInfo.color}`} />
                              <span className="text-sm font-medium">{tipoInfo.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {learning.frequencia}x
                              </Badge>
                            </div>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>

                          {learning.pergunta && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Pergunta:
                              </p>
                              <p className="text-sm">{learning.pergunta}</p>
                            </div>
                          )}

                          {learning.resposta && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Resposta:
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {learning.resposta}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(learning.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>

                            {learning.status === 'pendente' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(learning)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button size="sm" onClick={() => handleApprove(learning.id)}>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(learning.id)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejeitar
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLearning} onOpenChange={() => setEditingLearning(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Resposta</DialogTitle>
            <DialogDescription>
              Ajuste a resposta sugerida antes de aprovar
            </DialogDescription>
          </DialogHeader>

          {editingLearning && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Pergunta:</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {editingLearning.pergunta}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Resposta:</p>
                <Textarea
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  rows={6}
                  placeholder="Digite a resposta correta..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLearning(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar e Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
