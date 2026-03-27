import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useCreateDeal } from '@/hooks/useDeals';
import { PROPERTY_TYPE_OPTIONS_DEAL, LAZER_OPTIONS, PORTARIA_OPTIONS } from '@/types/deal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const dealSchema = z.object({
  listing_url: z.string().optional(),
  codigo_imovel: z.string().optional(),
  title: z.string().min(2, 'Título obrigatório').max(200),
  valor: z.coerce.number().optional().nullable(),
  metragem: z.coerce.number().optional().nullable(),
  tipo: z.string().optional(),
  quartos: z.coerce.number().optional().nullable(),
  suites: z.coerce.number().optional().nullable(),
  salas: z.coerce.number().optional().nullable(),
  cozinhas: z.coerce.number().optional().nullable(),
  banheiros: z.coerce.number().optional().nullable(),
  vagas: z.coerce.number().optional().nullable(),
  elevador_social: z.boolean().optional(),
  elevador_servico: z.boolean().optional(),
  portaria: z.string().optional().nullable(),
  area_lazer: z.array(z.string()).optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  endereco: z.string().optional(),
  numero_predio: z.string().regex(/^\d*$/, 'Apenas números').optional().or(z.literal('')),
  numero_apartamento: z.string().regex(/^\d*$/, 'Apenas números').optional().or(z.literal('')),
  bloco: z.string().optional(),
  comissao_percentual: z.coerce.number().min(0).max(100).optional(),
  tem_parceria: z.boolean().optional(),
  proprietario_nome: z.string().optional(),
  proprietario_whatsapp: z.string().optional(),
  proprietario_email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type DealFormData = z.infer<typeof dealSchema>;

interface Partner {
  nome: string;
  whatsapp: string;
  email: string;
}

interface NewDealFormProps {
  onClose: () => void;
}

export function NewDealForm({ onClose }: NewDealFormProps) {
  const createDeal = useCreateDeal();
  const [scraping, setScraping] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [scrapedImageUrl, setScrapedImageUrl] = useState<string | null>(null);
  const [scrapedDescription, setScrapedDescription] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      elevador_social: false,
      elevador_servico: false,
      portaria: null,
      tem_parceria: false,
      area_lazer: [],
      comissao_percentual: 6,
    },
  });

  const temParceria = watch('tem_parceria');
  const listingUrl = watch('listing_url');

  const validateListingUrl = (url: string): string | null => {
    if (!url || !url.trim()) return 'Insira o link do anúncio antes de extrair';
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    try {
      const parsed = new URL(formatted);
      if (!parsed.hostname.includes('.')) return 'URL inválida. Insira um link completo (ex: https://www.exemplo.com/imovel/123)';
    } catch {
      return 'URL inválida. Verifique o formato do link.';
    }
    return null;
  };

  const handleScrape = async () => {
    const currentUrl = watch('listing_url');
    const validationError = validateListingUrl(currentUrl || '');
    if (validationError) { toast.error(validationError); return; }

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-listing', {
        body: { url: currentUrl!.trim() },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        const d = data.data;
        if (d.title) setValue('title', d.title);
        if (d.codigo_imovel) setValue('codigo_imovel', d.codigo_imovel);
        if (d.valor) setValue('valor', d.valor);
        if (d.metragem) setValue('metragem', d.metragem);
        if (d.tipo) setValue('tipo', d.tipo);
        if (d.quartos) setValue('quartos', d.quartos);
        if (d.suites) setValue('suites', d.suites);
        if (d.salas) setValue('salas', d.salas);
        if (d.cozinhas) setValue('cozinhas', d.cozinhas);
        if (d.banheiros) setValue('banheiros', d.banheiros);
        if (d.vagas) setValue('vagas', d.vagas);
        if (d.elevador_social) setValue('elevador_social', d.elevador_social);
        if (d.elevador_servico) setValue('elevador_servico', d.elevador_servico);
        if (d.portaria) setValue('portaria', d.portaria);
        if (d.area_lazer?.length) {
          // Deduplicate by normalizing to lowercase
          const seen = new Set<string>();
          const unique = (d.area_lazer as string[]).filter((item: string) => {
            const key = item.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setValue('area_lazer', unique);
        }
        if (d.bairro) setValue('bairro', d.bairro);
        if (d.cidade) setValue('cidade', d.cidade);
        if (d.estado) setValue('estado', d.estado);
        if (d.endereco) setValue('endereco', d.endereco);
        if (d.numero_predio) setValue('numero_predio', d.numero_predio);
        if (d.numero_apartamento) setValue('numero_apartamento', d.numero_apartamento);
        if (d.bloco) setValue('bloco', d.bloco);
        if (d.listing_image_url) setScrapedImageUrl(d.listing_image_url);
        if (d.listing_description) setScrapedDescription(d.listing_description);
        toast.success(`Dados extraídos: "${d.title || 'Imóvel'}"`);
      } else {
        toast.error(data?.error || 'Não foi possível extrair os dados. Verifique se o link está correto.');
      }
    } catch (err: any) {
      toast.error('Erro ao extrair dados: ' + (err.message || 'Verifique o link e tente novamente'));
    } finally {
      setScraping(false);
    }
  };

  const onSubmit = async (formData: DealFormData) => {
    await createDeal.mutateAsync({
      ...formData,
      listing_image_url: scrapedImageUrl,
      listing_description: scrapedDescription,
      partners: temParceria ? partners.filter(p => p.nome.trim()) : [],
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl shadow-dramatic animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Novo Negócio</h2>
            <p className="text-sm text-muted-foreground">Cadastre um novo negócio imobiliário</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Link do Anúncio */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Link do Anúncio</h3>
            <div className="space-y-2">
              <Input placeholder="https://www.exemplo.com/imovel/123" {...register('listing_url')} />
              <Button type="button" variant="outline" onClick={handleScrape} disabled={scraping} className="w-full">
                {scraping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {scraping ? 'Extraindo dados...' : 'Extrair dados do anúncio com IA'}
              </Button>
            </div>
          </div>

          {/* Dados Físicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados do Imóvel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input placeholder="Ex: Apartamento 3 quartos no Lourdes" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Código do Imóvel</Label>
                <Input placeholder="Ex: 895219352" {...register('codigo_imovel')} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" placeholder="800000" {...register('valor')} />
              </div>
              <div className="space-y-2">
                <Label>Metragem (m²)</Label>
                <Input type="number" placeholder="120" {...register('metragem')} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select {...register('tipo')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="">Selecione...</option>
                  {PROPERTY_TYPE_OPTIONS_DEAL.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <div className="space-y-2"><Label>Quartos</Label><Input type="number" min={0} {...register('quartos')} /></div>
              <div className="space-y-2"><Label>Suítes</Label><Input type="number" min={0} {...register('suites')} /></div>
              <div className="space-y-2"><Label>Salas</Label><Input type="number" min={0} {...register('salas')} /></div>
              <div className="space-y-2"><Label>Cozinhas</Label><Input type="number" min={0} {...register('cozinhas')} /></div>
              <div className="space-y-2"><Label>Banheiros</Label><Input type="number" min={0} {...register('banheiros')} /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Vagas</Label><Input type="number" min={0} {...register('vagas')} /></div>
              <div className="flex items-center gap-3 pt-6">
                <Controller name="elevador_social" control={control} render={({ field }) => (
                  <Checkbox id="elev_social" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="elev_social" className="text-sm cursor-pointer">Elevador Social</Label>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Controller name="elevador_servico" control={control} render={({ field }) => (
                  <Checkbox id="elev_servico" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="elev_servico" className="text-sm cursor-pointer">Elevador Serviço</Label>
              </div>
            </div>

            {/* Portaria */}
            <div className="space-y-2">
              <Label>Portaria</Label>
              <select {...register('portaria')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Sem portaria</option>
                {PORTARIA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Área de Lazer */}
            <div>
              <Label className="mb-2 block">Área de Lazer</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Controller name="area_lazer" control={control} render={({ field }) => (
                  <>
                    {LAZER_OPTIONS.map(item => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lazer-${item}`}
                          checked={field.value?.includes(item)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, item] : current.filter(v => v !== item));
                          }}
                        />
                        <Label htmlFor={`lazer-${item}`} className="text-xs cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Bairro</Label><Input {...register('bairro')} /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input {...register('cidade')} /></div>
              <div className="space-y-2"><Label>Estado</Label><Input {...register('estado')} /></div>
            </div>
            <div className="space-y-2"><Label>Endereço</Label><Input {...register('endereco')} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nº Prédio</Label>
                <Input placeholder="Ex: 123" {...register('numero_predio')} inputMode="numeric" />
                {errors.numero_predio && <p className="text-xs text-destructive">{errors.numero_predio.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nº Apartamento</Label>
                <Input placeholder="Ex: 401" {...register('numero_apartamento')} inputMode="numeric" />
                {errors.numero_apartamento && <p className="text-xs text-destructive">{errors.numero_apartamento.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Bloco (opcional)</Label>
                <Input placeholder="Ex: A" {...register('bloco')} />
              </div>
            </div>
          </div>

          {/* Comissão e Parceria */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Comissão e Parcerias</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input type="number" step="0.5" min={0} max={100} {...register('comissao_percentual')} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Controller name="tem_parceria" control={control} render={({ field }) => (
                  <Switch id="parceria" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="parceria" className="cursor-pointer">Tem parceria</Label>
              </div>
            </div>

            {temParceria && (
              <div className="space-y-3 p-4 rounded-lg border border-border bg-secondary/10">
                <div className="flex items-center justify-between">
                  <Label>Parceiros</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPartners([...partners, { nome: '', whatsapp: '', email: '' }])}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                  </Button>
                </div>
                {partners.map((partner, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <Input placeholder="Nome" value={partner.nome} onChange={e => { const p = [...partners]; p[i].nome = e.target.value; setPartners(p); }} />
                    <Input placeholder="WhatsApp" value={partner.whatsapp} onChange={e => { const p = [...partners]; p[i].whatsapp = e.target.value; setPartners(p); }} />
                    <Input placeholder="Email (opcional)" value={partner.email} onChange={e => { const p = [...partners]; p[i].email = e.target.value; setPartners(p); }} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPartners(partners.filter((_, j) => j !== i))}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proprietário */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Proprietário</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input {...register('proprietario_nome')} /></div>
              <div className="space-y-2"><Label>WhatsApp</Label><Input {...register('proprietario_whatsapp')} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" {...register('proprietario_email')} /></div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={createDeal.isPending} className="flex-1 gradient-gold text-white">
              {createDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cadastrar Negócio
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
