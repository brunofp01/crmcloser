import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAIAdmin } from '@/hooks/useAI';
import { useSyncLogs, useLatestSync, SyncLog } from '@/hooks/useSyncLogs';
import { toast } from 'sonner';
import { 
  Building2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  ExternalLink,
  Database,
  Loader2,
  Home,
  MapPin,
  DollarSign,
  AlertCircle,
  History,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Property {
  id: string;
  codigo: string;
  slug: string;
  titulo: string | null;
  tipo: string | null;
  categoria: string | null;
  valor: number | null;
  quartos: number | null;
  bairro: string | null;
  cidade: string | null;
  ativo: boolean;
  synced_at: string;
  source?: string | null;
  hotsite_url?: string | null;
}

interface PropertySource {
  id: string;
  name: string;
  description: string | null;
  base_url: string | null;
  hotsite_base_url: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
}

interface SyncStatus {
  lastSync: string | null;
  totalProperties: number;
  activeProperties: number;
  syncInProgress: boolean;
}

export function KnowledgeBasePage() {
  const { syncProperties, syncBlowProperties, isLoading: aiLoading } = useAIAdmin();
  const { data: syncLogs = [], refetch: refetchLogs } = useSyncLogs(20);
  const { data: latestSync, refetch: refetchLatestSync } = useLatestSync();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [propertySources, setPropertySources] = useState<PropertySource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    totalProperties: 0,
    activeProperties: 0,
    syncInProgress: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingBlow, setSyncingBlow] = useState(false);
  const [activeTab, setActiveTab] = useState('properties');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim() && sourceFilter === 'all') {
      setFilteredProperties(properties);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProperties(
        properties.filter(
          (p) => {
            const matchesSearch = !term || 
              p.codigo?.toLowerCase().includes(term) ||
              p.titulo?.toLowerCase().includes(term) ||
              p.bairro?.toLowerCase().includes(term) ||
              p.cidade?.toLowerCase().includes(term) ||
              p.tipo?.toLowerCase().includes(term);
            
            const matchesSource = sourceFilter === 'all' || p.source === sourceFilter;
            
            return matchesSearch && matchesSource;
          }
        )
      );
    }
  }, [searchTerm, sourceFilter, properties]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch properties with pagination
      const { data: propertiesData, error } = await supabase
        .from('imoveis')
        .select('id, codigo, slug, titulo, tipo, categoria, valor, quartos, bairro, cidade, ativo, synced_at, source, hotsite_url')
        .order('synced_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch property sources
      const { data: sourcesData } = await supabase
        .from('property_sources')
        .select('*')
        .order('name');
      
      setPropertySources((sourcesData || []) as PropertySource[]);

      // Get counts by source
      const { count: totalCount } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true });

      const { count: activeCount } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // Get last sync time
      const { data: lastSyncData } = await supabase
        .from('imoveis')
        .select('synced_at')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      setProperties((propertiesData || []) as Property[]);
      setFilteredProperties((propertiesData || []) as Property[]);
      setSyncStatus({
        lastSync: lastSyncData?.synced_at || null,
        totalProperties: totalCount || 0,
        activeProperties: activeCount || 0,
        syncInProgress: false,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (source: 'privus' | 'blow' | 'all' = 'all') => {
    if (source === 'blow') {
      setSyncingBlow(true);
    } else {
      setSyncing(true);
    }
    setSyncStatus((prev) => ({ ...prev, syncInProgress: true }));

    try {
      const result = await syncProperties(source);

      if (result?.success) {
        if (result.skipped) {
          toast.info('Feeds não alterados desde a última sincronização');
        } else {
          toast.success(
            `Sincronização concluída: ${result.stats?.inserted || 0} novos, ${result.stats?.updated || 0} atualizados, ${result.stats?.deactivated || 0} desativados`
          );
        }
        await loadData();
        refetchLogs();
        refetchLatestSync();
      } else {
        toast.error(result?.error || 'Erro na sincronização');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar');
    } finally {
      setSyncing(false);
      setSyncingBlow(false);
      setSyncStatus((prev) => ({ ...prev, syncInProgress: false }));
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falha</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Parcial</Badge>;
      case 'started':
        return <Badge variant="secondary">Em andamento</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Base de Conhecimento
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie a integração de imóveis e o feed XML
          </p>
        </div>
        <Button onClick={() => handleSync('all')} disabled={syncing || syncingBlow || aiLoading} className="w-full sm:w-auto">
          {syncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sincronizar Tudo
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Imóveis</p>
                <p className="text-lg md:text-2xl font-bold">{syncStatus.totalProperties}</p>
              </div>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  {syncStatus.activeProperties}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Inativos</p>
                <p className="text-lg md:text-2xl font-bold text-red-600">
                  {syncStatus.totalProperties - syncStatus.activeProperties}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Última Sinc.</p>
                <p className="text-xs md:text-sm font-medium">
                  {syncStatus.lastSync
                    ? format(new Date(syncStatus.lastSync), "dd/MM HH:mm", { locale: ptBR })
                    : 'Nunca'}
                </p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Fontes de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Privus Source */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                🏠 Privus Imóveis
                <Badge variant="outline" className="text-xs">XML</Badge>
              </p>
              <p className="text-xs text-muted-foreground break-all">
                https://www.privusimoveis.com.br/integracao/lais
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={syncing ? 'default' : 'secondary'}>
                {syncing ? 'Sincronizando...' : 'Conectado'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSync('privus')} 
                disabled={syncing || syncingBlow || aiLoading}
              >
                {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Blow Source */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium flex items-center gap-2">
                🏗️ Blow Empreendimentos
                <Badge variant="outline" className="text-xs">Web Scraping</Badge>
              </p>
              <p className="text-xs text-muted-foreground break-all">
                https://www.blow.com.br/empreendimentos/
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Links personalizados: main.draodhn69q581.amplifyapp.com/hotsite/
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={syncingBlow ? 'default' : 'secondary'}>
                {syncingBlow ? 'Sincronizando...' : 'Conectado'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleSync('blow')} 
                disabled={syncing || syncingBlow || aiLoading}
              >
                {syncingBlow ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Sincronização Automática Ativa
              </p>
              <p className="text-xs text-muted-foreground">
                Privus: a cada 5 min | Blow: a cada 6 horas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Properties and Sync History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Imóveis</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico de Sync</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Imóveis Cadastrados
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Mostrando {filteredProperties.length} de {properties.length} imóveis
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar imóveis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel sincronizado'}
                  </p>
                  {!searchTerm && (
                    <Button variant="outline" onClick={() => handleSync('all')} className="mt-4">
                      Sincronizar Fontes
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    <ScrollArea className="h-[400px]">
                      {filteredProperties.map((property) => (
                        <Card key={property.id} className="mb-3">
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm line-clamp-1">
                                  {property.titulo || `Imóvel ${property.codigo}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Código: {property.codigo}
                                </p>
                              </div>
                              <Badge variant={property.ativo ? 'default' : 'secondary'}>
                                {property.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {property.tipo && (
                                <span className="flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  {property.tipo}
                                </span>
                              )}
                              {property.bairro && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {property.bairro}
                                </span>
                              )}
                              {property.valor && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(property.valor)}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Código</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Bairro</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Quartos</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProperties.map((property) => (
                            <TableRow key={property.id}>
                              <TableCell className="font-mono text-xs">
                                {property.codigo}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {property.titulo || '-'}
                              </TableCell>
                              <TableCell>{property.tipo || '-'}</TableCell>
                              <TableCell>
                                {property.bairro}
                                {property.cidade && `, ${property.cidade}`}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(property.valor)}
                              </TableCell>
                              <TableCell className="text-center">
                                {property.quartos || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={property.ativo ? 'default' : 'secondary'}>
                                  {property.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Histórico de Sincronizações
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Últimas {syncLogs.length} sincronizações do feed XML
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum histórico de sincronização</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {syncLogs.map((log) => (
                      <Card key={log.id} className={`border-l-4 ${
                        log.status === 'success' ? 'border-l-green-500' :
                        log.status === 'failed' ? 'border-l-red-500' :
                        log.status === 'partial' ? 'border-l-yellow-500' :
                        'border-l-blue-500'
                      }`}>
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {getSyncStatusBadge(log.status)}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.started_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground">Duração</p>
                              <p className="font-medium">{formatDuration(log.duration_ms)}</p>
                            </div>
                          </div>
                          
                          {log.status !== 'started' && (
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-semibold">{log.total_items}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Novos</p>
                                <p className="font-semibold text-green-600">{log.inserted}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Atualizados</p>
                                <p className="font-semibold text-blue-600">{log.updated}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Erros</p>
                                <p className={`font-semibold ${log.errors_count > 0 ? 'text-red-600' : ''}`}>
                                  {log.errors_count}
                                </p>
                              </div>
                            </div>
                          )}

                          {log.error_message && (
                            <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded text-xs">
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-red-700 dark:text-red-400">{log.error_message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
