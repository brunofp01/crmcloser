import { useState } from 'react';
import { Client } from '@/types/client';
import { useUpdateClient } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import { useIsMaster } from '@/hooks/useUserRole';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  PROPERTY_TYPE_OPTIONS,
  LEISURE_FEATURE_OPTIONS,
  URGENCIA_OPTIONS,
  FINALIDADE_OPTIONS,
  FORMA_PAGAMENTO_OPTIONS,
  ELEVATOR_OPTIONS,
  PORTARIA_OPTIONS,
} from '@/types/client';

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Telefone inválido'),
  stage: z.enum(['lead', 'qualification', 'contact', 'visit', 'proposal', 'negotiation', 'closed', 'quarantine', 'lost'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
  source: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
  // Search criteria
  budget_min: z.coerce.number().optional().nullable(),
  budget_max: z.coerce.number().optional().nullable(),
  bedrooms_min: z.coerce.number().optional().nullable(),
  parking_min: z.coerce.number().optional().nullable(),
  area_min: z.coerce.number().optional().nullable(),
  property_types: z.array(z.string()).optional(),
  preferred_region: z.string().optional(),
  cidades: z.string().optional(),
  needs_leisure: z.boolean().optional(),
  leisure_features: z.array(z.string()).optional(),
  portaria_preferencia: z.array(z.string()).optional(),
  region_flexible: z.boolean().optional(),
  elevator_preference: z.string().optional(),
  // Qualification
  forma_pagamento: z.array(z.string()).optional(),
  urgencia: z.string().optional(),
  finalidade: z.string().optional(),
  is_investidor: z.boolean().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface EditClientFormProps {
  client: Client;
  onClose: () => void;
  onSuccess?: () => void;
}

const STAGE_OPTIONS = [
  { value: 'lead', label: 'Novo Lead' },
  { value: 'qualification', label: 'Qualificação' },
  { value: 'contact', label: 'Perfil Definido' },
  { value: 'visit', label: 'Visita Agendada' },
  { value: 'proposal', label: 'Proposta Enviada' },
  { value: 'negotiation', label: 'Em Negociação' },
  { value: 'closed', label: 'Fechado' },
  { value: 'quarantine', label: 'Quarentena' },
  { value: 'lost', label: 'Desistência' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

const SOURCE_OPTIONS = ['Indicação', 'Site', 'Instagram', 'Facebook', 'Google Ads', 'Portal Imobiliário', 'Placa', 'Quinto Andar', 'Outro'];

export function EditClientForm({ client, onClose, onSuccess }: EditClientFormProps) {
  const updateClient = useUpdateClient();
  const { data: users = [] } = useUsers();
  const isMaster = useIsMaster();

  const {
    register, handleSubmit, control, watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || '',
      phone: client.phone,
      stage: client.stage,
      priority: client.priority,
      source: client.source || '',
      notes: client.notes || '',
      assigned_to: client.assigned_to || '',
      budget_min: client.budget_min || undefined,
      budget_max: client.budget_max || undefined,
      bedrooms_min: client.bedrooms_min || undefined,
      parking_min: client.parking_min || undefined,
      area_min: client.area_min || undefined,
      property_types: client.property_types || [],
      preferred_region: client.preferred_region || '',
      cidades: client.cidades?.join(', ') || '',
      needs_leisure: client.needs_leisure || false,
      leisure_features: client.leisure_features || [],
      portaria_preferencia: client.portaria_preferencia || [],
      region_flexible: client.region_flexible || false,
      elevator_preference: client.elevator_preference || 'indiferente',
      forma_pagamento: client.forma_pagamento || [],
      urgencia: client.urgencia || '',
      finalidade: client.finalidade || '',
      is_investidor: client.is_investidor || false,
    },
  });

  const needsLeisure = watch('needs_leisure');

  const onSubmit = async (data: ClientFormData) => {
    try {
      const cidadesArray = data.cidades
        ? data.cidades.split(',').map(c => c.trim()).filter(Boolean)
        : [];

      await updateClient.mutateAsync({
        id: client.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        stage: data.stage,
        priority: data.priority,
        source: data.source || null,
        notes: data.notes || null,
        assigned_to: data.assigned_to || null,
        budget_min: data.budget_min || null,
        budget_max: data.budget_max || null,
        bedrooms_min: data.bedrooms_min || null,
        parking_min: data.parking_min || null,
        area_min: data.area_min || null,
        property_types: data.property_types || [],
        preferred_region: data.preferred_region || null,
        cidades: cidadesArray.length > 0 ? cidadesArray : null,
        needs_leisure: data.needs_leisure || false,
        leisure_features: data.leisure_features || [],
        portaria_preferencia: data.portaria_preferencia || [],
        region_flexible: data.region_flexible || false,
        elevator_preference: data.elevator_preference || 'indiferente',
        forma_pagamento: data.forma_pagamento || [],
        urgencia: data.urgencia || null,
        finalidade: data.finalidade || null,
        is_investidor: data.is_investidor || false,
      });
      toast.success('Cliente atualizado com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl shadow-dramatic overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Editar Cliente</h2>
            <p className="text-sm text-muted-foreground">Atualize os dados do cliente</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <Input {...register('name')} className="mt-1" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">WhatsApp *</label>
              <Input {...register('phone')} className="mt-1" />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input {...register('email')} type="email" className="mt-1" />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Estágio</label>
              <select {...register('stage')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <select {...register('priority')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Origem</label>
              <select {...register('source')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                <option value="">Selecione...</option>
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {isMaster && (
              <div>
                <label className="text-sm font-medium text-foreground">Atribuir a</label>
                <select {...register('assigned_to')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione...</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Search Criteria */}
          <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/10">
            <h3 className="font-medium text-foreground">Critérios de Busca</h3>

            {/* Property Types */}
            <div>
              <Label className="mb-2 block">Tipos de Imóvel</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Controller name="property_types" control={control} render={({ field }) => (
                  <>
                    {PROPERTY_TYPE_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-prop-${opt.value}`}
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                          }}
                        />
                        <Label htmlFor={`edit-prop-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Bairros Preferidos</label>
                <Input {...register('preferred_region')} className="mt-1" placeholder="Lourdes, Serra..." />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cidades</label>
                <Input {...register('cidades')} className="mt-1" placeholder="BH, Nova Lima..." />
              </div>
            </div>

            {/* Region Flexibility */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <Controller name="region_flexible" control={control} render={({ field }) => (
                <Checkbox id="edit_region_flexible" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <div className="flex-1">
                <Label htmlFor="edit_region_flexible" className="text-sm font-medium cursor-pointer">Aceita região inteira</Label>
                <p className="text-xs text-muted-foreground">Se marcado, aceita imóveis em toda a região.</p>
              </div>
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Orçamento Mínimo (R$)</label>
                <Input {...register('budget_min')} type="number" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Orçamento Máximo (R$)</label>
                <Input {...register('budget_max')} type="number" className="mt-1" />
              </div>
            </div>

            {/* Physical Specs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Quartos (mín)</label>
                <Input {...register('bedrooms_min')} type="number" min={0} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Vagas (mín)</label>
                <Input {...register('parking_min')} type="number" min={0} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Área mín (m²)</label>
                <Input {...register('area_min')} type="number" min={0} className="mt-1" />
              </div>
            </div>

            {/* Elevator */}
            <div>
              <label className="text-sm font-medium text-foreground">Elevador</label>
              <select {...register('elevator_preference')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {ELEVATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Portaria */}
            <div>
              <Label className="mb-2 block">Portaria</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Controller name="portaria_preferencia" control={control} render={({ field }) => (
                  <>
                    {PORTARIA_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-portaria-${opt.value}`}
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                          }}
                        />
                        <Label htmlFor={`edit-portaria-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>

            {/* Leisure */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Controller name="needs_leisure" control={control} render={({ field }) => (
                  <Checkbox id="edit_needs_leisure" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="edit_needs_leisure" className="text-sm font-medium cursor-pointer">Precisa de lazer</Label>
              </div>
              {needsLeisure && (
                <div>
                  <Label className="mb-2 block">Itens de Lazer</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Controller name="leisure_features" control={control} render={({ field }) => (
                      <>
                        {LEISURE_FEATURE_OPTIONS.map(opt => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-leisure-${opt.value}`}
                              checked={field.value?.includes(opt.value)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                              }}
                            />
                            <Label htmlFor={`edit-leisure-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                          </div>
                        ))}
                      </>
                    )} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Qualification */}
          <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/10">
            <h3 className="font-medium text-foreground">Qualificação de Compra</h3>

            {/* Investidor Toggle */}
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <Controller name="is_investidor" control={control} render={({ field }) => (
                <Checkbox id="edit_is_investidor" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label htmlFor="edit_is_investidor" className="text-sm font-medium cursor-pointer">Cliente Investidor (compra recorrente)</Label>
            </div>
            <div>
              <Label className="mb-2 block">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Controller name="forma_pagamento" control={control} render={({ field }) => (
                  <>
                    {FORMA_PAGAMENTO_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-pay-${opt.value}`}
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                          }}
                        />
                        <Label htmlFor={`edit-pay-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Urgência</label>
                <select {...register('urgencia')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione...</option>
                  {URGENCIA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Finalidade</label>
                <select {...register('finalidade')} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione...</option>
                  {FINALIDADE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground">Observações</label>
            <Textarea {...register('notes')} className="mt-1" rows={3} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
