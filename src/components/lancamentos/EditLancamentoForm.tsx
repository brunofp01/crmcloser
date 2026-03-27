import { useState } from 'react';
import { Lancamento, useUpdateLancamento } from '@/hooks/useLancamentos';
import { supabase } from '@/integrations/supabase/client';
import { LAZER_OPTIONS, PROPERTY_TYPE_OPTIONS_DEAL } from '@/types/deal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { X, Loader2, ChevronLeft, Plus, Trash2, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface EditLancamentoFormProps {
  lancamento: Lancamento;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pre_launch', label: 'Pré-Lançamento' },
  { value: 'active', label: 'Em Lançamento' },
  { value: 'construction', label: 'Em Obras' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'sold_out', label: 'Esgotado' },
];

export function EditLancamentoForm({ lancamento: l, onClose }: EditLancamentoFormProps) {
  const updateLancamento = useUpdateLancamento();

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);

  const [nome, setNome] = useState(l.nome);
  const [construtora, setConstrutora] = useState(l.construtora || '');
  const [descricao, setDescricao] = useState(l.descricao || '');
  const [status, setStatus] = useState(l.status);
  const [tipo, setTipo] = useState(l.tipo || '');
  const [bairro, setBairro] = useState(l.bairro || '');
  const [cidade, setCidade] = useState(l.cidade || '');
  const [estado, setEstado] = useState(l.estado || '');
  const [endereco, setEndereco] = useState(l.endereco || '');
  const [previsaoEntrega, setPrevisaoEntrega] = useState(l.previsao_entrega || '');
  const [valorMin, setValorMin] = useState(l.valor_min ? String(l.valor_min) : '');
  const [valorMax, setValorMax] = useState(l.valor_max ? String(l.valor_max) : '');
  const [areaMin, setAreaMin] = useState(l.area_min ? String(l.area_min) : '');
  const [areaMax, setAreaMax] = useState(l.area_max ? String(l.area_max) : '');
  const [quartosMin, setQuartosMin] = useState(l.quartos_min ? String(l.quartos_min) : '');
  const [quartosMax, setQuartosMax] = useState(l.quartos_max ? String(l.quartos_max) : '');
  const [suitesMin, setSuitesMin] = useState(l.suites_min ? String(l.suites_min) : '');
  const [suitesMax, setSuitesMax] = useState(l.suites_max ? String(l.suites_max) : '');
  const [vagasMin, setVagasMin] = useState(l.vagas_min ? String(l.vagas_min) : '');
  const [vagasMax, setVagasMax] = useState(l.vagas_max ? String(l.vagas_max) : '');
  const [andares, setAndares] = useState(l.andares ? String(l.andares) : '');
  const [totalUnidades, setTotalUnidades] = useState(l.total_unidades ? String(l.total_unidades) : '');
  const [areaLazer, setAreaLazer] = useState<string[]>(Array.isArray(l.area_lazer) ? l.area_lazer : []);
  const [diferenciais, setDiferenciais] = useState<string[]>(Array.isArray(l.diferenciais) ? l.diferenciais : []);
  const [novoDiferencial, setNovoDiferencial] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(l.website_url || '');
  const [videoUrl, setVideoUrl] = useState(l.video_url || '');
  const [comissao, setComissao] = useState(l.comissao_percentual ? String(l.comissao_percentual) : '');
  const [observacoes, setObservacoes] = useState(l.observacoes || '');
  const [fotos, setFotos] = useState<string[]>(Array.isArray(l.fotos) ? l.fotos : []);

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast.error('Insira o link da página do empreendimento');
      return;
    }
    let formatted = scrapeUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    try {
      const parsed = new URL(formatted);
      if (!parsed.hostname.includes('.')) { toast.error('URL inválida'); return; }
    } catch { toast.error('URL inválida.'); return; }

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-lancamento', { body: { url: formatted } });
      if (error) throw error;
      if (data?.success && data.data) {
        const d = data.data;
        if (d.nome) setNome(d.nome);
        if (d.construtora) setConstrutora(d.construtora);
        if (d.descricao) setDescricao(d.descricao);
        if (d.tipo) setTipo(d.tipo);
        if (d.bairro) setBairro(d.bairro);
        if (d.cidade) setCidade(d.cidade);
        if (d.estado) setEstado(d.estado);
        if (d.endereco) setEndereco(d.endereco);
        if (d.previsao_entrega) setPrevisaoEntrega(d.previsao_entrega);
        if (d.valor_min) setValorMin(String(d.valor_min));
        if (d.valor_max) setValorMax(String(d.valor_max));
        if (d.area_min) setAreaMin(String(d.area_min));
        if (d.area_max) setAreaMax(String(d.area_max));
        if (d.quartos_min) setQuartosMin(String(d.quartos_min));
        if (d.quartos_max) setQuartosMax(String(d.quartos_max));
        if (d.suites_min) setSuitesMin(String(d.suites_min));
        if (d.suites_max) setSuitesMax(String(d.suites_max));
        if (d.vagas_min) setVagasMin(String(d.vagas_min));
        if (d.vagas_max) setVagasMax(String(d.vagas_max));
        if (d.andares) setAndares(String(d.andares));
        if (d.total_unidades) setTotalUnidades(String(d.total_unidades));
        if (d.area_lazer?.length) {
          const seen = new Set<string>();
          const unique = (d.area_lazer as string[]).filter((item: string) => {
            const key = item.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setAreaLazer(unique);
        }
        if (d.diferenciais?.length) setDiferenciais(d.diferenciais);
        if (d.website_url) setWebsiteUrl(d.website_url);
        if (d.video_url) setVideoUrl(d.video_url);
        if (d.hero_image_url) {
          setFotos(prev => prev.includes(d.hero_image_url) ? prev : [d.hero_image_url, ...prev]);
        }
        toast.success('Dados atualizados com sucesso!');
      } else {
        toast.error(data?.error || 'Não foi possível extrair os dados');
      }
    } catch (err: any) {
      toast.error('Erro ao extrair dados: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateLancamento.mutateAsync({
      id: l.id,
      nome,
      construtora: construtora || null,
      descricao: descricao || null,
      status,
      tipo: tipo || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      endereco: endereco || null,
      previsao_entrega: previsaoEntrega || null,
      valor_min: valorMin ? Number(valorMin) : null,
      valor_max: valorMax ? Number(valorMax) : null,
      area_min: areaMin ? Number(areaMin) : null,
      area_max: areaMax ? Number(areaMax) : null,
      quartos_min: quartosMin ? Number(quartosMin) : null,
      quartos_max: quartosMax ? Number(quartosMax) : null,
      suites_min: suitesMin ? Number(suitesMin) : null,
      suites_max: suitesMax ? Number(suitesMax) : null,
      vagas_min: vagasMin ? Number(vagasMin) : null,
      vagas_max: vagasMax ? Number(vagasMax) : null,
      andares: andares ? Number(andares) : null,
      total_unidades: totalUnidades ? Number(totalUnidades) : null,
      area_lazer: areaLazer,
      diferenciais,
      website_url: websiteUrl || null,
      video_url: videoUrl || null,
      comissao_percentual: comissao ? Number(comissao) : 0,
      observacoes: observacoes || null,
      fotos: fotos.length > 0 ? fotos : [],
    } as any);
    onClose();
  };

  const addDiferencial = () => {
    if (novoDiferencial.trim()) {
      setDiferenciais(prev => [...prev, novoDiferencial.trim()]);
      setNovoDiferencial('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">Editar Lançamento</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Scrape section */}
          <div className="card-elevated p-4 space-y-3 border-l-2 border-accent/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Re-importar da Web</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cole um link para atualizar os dados do empreendimento automaticamente.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="https://construtora.com.br/empreendimento"
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  className="pl-9 text-xs"
                  disabled={scraping}
                />
              </div>
              <Button type="button" onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} className="gradient-gold text-white gap-1.5 shrink-0" size="sm">
                {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {scraping ? 'Extraindo...' : 'Extrair'}
              </Button>
            </div>
          </div>

          {/* Cover photos */}
          {fotos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Fotos ({fotos.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden h-20 bg-muted">
                    <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Informações Básicas</h3>
            <Input placeholder="Nome do empreendimento *" value={nome} onChange={e => setNome(e.target.value)} required />
            <Input placeholder="Construtora" value={construtora} onChange={e => setConstrutora(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm">
                  <option value="">Selecionar</option>
                  {PROPERTY_TYPE_OPTIONS_DEAL.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <Input placeholder="Previsão de entrega (ex: Dez/2026)" value={previsaoEntrega} onChange={e => setPrevisaoEntrega(e.target.value)} />
            <textarea
              placeholder="Descrição do empreendimento"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[80px] resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Localização</h3>
            <Input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} />
              <Input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} />
              <Input placeholder="Estado" value={estado} onChange={e => setEstado(e.target.value)} />
            </div>
          </div>

          {/* Values */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Valores</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Valor mínimo</Label>
                <Input type="number" placeholder="0" value={valorMin} onChange={e => setValorMin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor máximo</Label>
                <Input type="number" placeholder="0" value={valorMax} onChange={e => setValorMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Comissão (%)</Label>
              <Input type="number" step="0.1" placeholder="0" value={comissao} onChange={e => setComissao(e.target.value)} />
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Especificações</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Quartos (min)</Label><Input type="number" min={0} value={quartosMin} onChange={e => setQuartosMin(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Quartos (max)</Label><Input type="number" min={0} value={quartosMax} onChange={e => setQuartosMax(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Suítes (min)</Label><Input type="number" min={0} value={suitesMin} onChange={e => setSuitesMin(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Suítes (max)</Label><Input type="number" min={0} value={suitesMax} onChange={e => setSuitesMax(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Vagas (min)</Label><Input type="number" min={0} value={vagasMin} onChange={e => setVagasMin(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Vagas (max)</Label><Input type="number" min={0} value={vagasMax} onChange={e => setVagasMax(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Área (min m²)</Label><Input type="number" min={0} value={areaMin} onChange={e => setAreaMin(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Área (max m²)</Label><Input type="number" min={0} value={areaMax} onChange={e => setAreaMax(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Andares</Label><Input type="number" min={0} value={andares} onChange={e => setAndares(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Total de unidades</Label><Input type="number" min={0} value={totalUnidades} onChange={e => setTotalUnidades(e.target.value)} /></div>
            </div>
          </div>

          {/* Leisure */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Área de Lazer</h3>
            <div className="flex flex-wrap gap-1.5">
              {LAZER_OPTIONS.map(item => {
                const isSelected = areaLazer.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAreaLazer(prev => isSelected ? prev.filter(x => x !== item) : [...prev, item])}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      isSelected ? 'bg-accent text-white border-accent' : 'bg-secondary text-muted-foreground border-border hover:border-accent/50'
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {areaLazer.filter(a => !LAZER_OPTIONS.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {areaLazer.filter(a => !LAZER_OPTIONS.includes(a)).map((item, i) => (
                  <button key={`extra-${i}`} type="button" onClick={() => setAreaLazer(prev => prev.filter(x => x !== item))}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border bg-accent text-white border-accent">
                    {item} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Differentials */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Diferenciais</h3>
            <div className="flex gap-2">
              <Input placeholder="Adicionar diferencial..." value={novoDiferencial} onChange={e => setNovoDiferencial(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDiferencial())} />
              <Button type="button" variant="outline" size="icon" onClick={addDiferencial}><Plus className="w-4 h-4" /></Button>
            </div>
            {diferenciais.length > 0 && (
              <div className="space-y-1">
                {diferenciais.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 text-xs">
                    <span>{d}</span>
                    <button type="button" onClick={() => setDiferenciais(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Links</h3>
            <Input placeholder="Website do empreendimento" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
            <Input placeholder="URL do vídeo" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Observações</h3>
            <textarea placeholder="Observações internas..." value={observacoes} onChange={e => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-none" />
          </div>

          <Button type="submit" className="w-full gradient-gold" disabled={updateLancamento.isPending}>
            {updateLancamento.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar Alterações
          </Button>
        </form>
      </ScrollArea>
    </div>
  );
}
