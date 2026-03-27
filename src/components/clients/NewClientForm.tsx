import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateClient } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import { useIsMaster } from '@/hooks/useUserRole';
import { checkDuplicatePhone } from '@/hooks/useCheckDuplicatePhone';
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
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter no mínimo 10 dígitos'),
  source: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
  // Search criteria
  property_types: z.array(z.string()).optional(),
  preferred_region: z.string().optional(),
  cidades: z.string().optional(), // comma-separated input
  budget_min: z.coerce.number().optional().nullable(),
  budget_max: z.coerce.number().optional().nullable(),
  area_min: z.coerce.number().optional().nullable(),
  bedrooms_min: z.coerce.number().optional().nullable(),
  parking_min: z.coerce.number().optional().nullable(),
  // Elevator & leisure
  elevator_preference: z.string().optional(),
  needs_leisure: z.boolean().optional(),
  leisure_features: z.array(z.string()).optional(),
  portaria_preferencia: z.array(z.string()).optional(),
  // Qualification
  forma_pagamento: z.array(z.string()).optional(),
  urgencia: z.string().optional(),
  finalidade: z.string().optional(),
  is_investidor: z.boolean().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface NewClientFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SOURCE_OPTIONS = [
  'Site', 'Instagram', 'Facebook', 'Google', 'LinkedIn',
  'Indicação', 'Placa', 'Portais Imobiliários', 'Quinto Andar', 'Outro',
];

export function NewClientForm({ onClose, onSuccess }: NewClientFormProps) {
  const createClient = useCreateClient();
  const { data: users = [] } = useUsers();
  const isMaster = useIsMaster();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      needs_leisure: false,
      is_investidor: false,
      property_types: [],
      leisure_features: [],
      portaria_preferencia: [],
      forma_pagamento: [],
      elevator_preference: 'indiferente',
      urgencia: '',
      finalidade: '',
    },
  });

  const needsLeisure = watch('needs_leisure');

  const onSubmit = async (data: ClientFormData) => {
    // Check for duplicate phone
    const { exists, clientName } = await checkDuplicatePhone(data.phone);
    if (exists) {
      toast.error(`Já existe um cliente cadastrado com este telefone: ${clientName}`);
      return;
    }

    const cidadesArray = data.cidades 
      ? data.cidades.split(',').map(c => c.trim()).filter(Boolean) 
      : [];

    await createClient.mutateAsync({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone,
      source: data.source || undefined,
      assigned_to: data.assigned_to || undefined,
      notes: data.notes || undefined,
      preferred_region: data.preferred_region || undefined,
      budget_min: data.budget_min || undefined,
      budget_max: data.budget_max || undefined,
      area_min: data.area_min || undefined,
      bedrooms_min: data.bedrooms_min || undefined,
      parking_min: data.parking_min || undefined,
      property_types: data.property_types || [],
      elevator_preference: data.elevator_preference || 'indiferente',
      needs_leisure: data.needs_leisure || false,
      leisure_features: data.leisure_features || [],
      portaria_preferencia: data.portaria_preferencia || [],
      forma_pagamento: data.forma_pagamento || [],
      urgencia: data.urgencia || undefined,
      finalidade: data.finalidade || undefined,
      cidades: cidadesArray.length > 0 ? cidadesArray : undefined,
      region_flexible: false,
      is_investidor: data.is_investidor || false,
    });
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl shadow-dramatic animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Novo Cliente</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados do cliente</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" placeholder="Nome do cliente" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <Input id="phone" placeholder="(31) 99999-9999" {...register('phone')} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Origem</Label>
                <select id="source" {...register('source')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione...</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {isMaster && (
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Atribuir a</Label>
                <select id="assigned_to" {...register('assigned_to')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione um corretor...</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Search Criteria */}
          <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/10">
            <h3 className="text-sm font-medium text-foreground">Critérios de Busca</h3>

            {/* Property Types */}
            <div>
              <Label className="mb-2 block">Tipos de Imóvel</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Controller name="property_types" control={control} render={({ field }) => (
                  <>
                    {PROPERTY_TYPE_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-prop-${opt.value}`}
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                          }}
                        />
                        <Label htmlFor={`new-prop-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_region">Bairros Preferidos</Label>
                <Input id="preferred_region" placeholder="Lourdes, Funcionários, Serra..." {...register('preferred_region')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidades">Cidades</Label>
                <Input id="cidades" placeholder="Belo Horizonte, Nova Lima..." {...register('cidades')} />
              </div>
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Orçamento Mínimo (R$)</Label>
                <Input id="budget_min" type="number" placeholder="500000" {...register('budget_min')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Orçamento Máximo (R$)</Label>
                <Input id="budget_max" type="number" placeholder="900000" {...register('budget_max')} />
              </div>
            </div>

            {/* Physical specs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area_min">Área mín (m²)</Label>
                <Input id="area_min" type="number" placeholder="80" min={0} {...register('area_min')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms_min">Quartos (mín)</Label>
                <Input id="bedrooms_min" type="number" placeholder="3" min={0} {...register('bedrooms_min')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking_min">Vagas (mín)</Label>
                <Input id="parking_min" type="number" placeholder="2" min={0} {...register('parking_min')} />
              </div>
            </div>

            {/* Elevator */}
            <div className="space-y-2">
              <Label>Elevador</Label>
              <select {...register('elevator_preference')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {ELEVATOR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
                          id={`new-portaria-${opt.value}`}
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                          }}
                        />
                        <Label htmlFor={`new-portaria-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Controller name="needs_leisure" control={control} render={({ field }) => (
                  <Checkbox id="new_needs_leisure" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="new_needs_leisure" className="text-sm font-medium cursor-pointer">Precisa de lazer no prédio</Label>
              </div>
              {needsLeisure && (
                <div>
                  <Label className="mb-2 block">Itens de Lazer Obrigatórios</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Controller name="leisure_features" control={control} render={({ field }) => (
                      <>
                        {LEISURE_FEATURE_OPTIONS.map(opt => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`new-leisure-${opt.value}`}
                              checked={field.value?.includes(opt.value)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                              }}
                            />
                            <Label htmlFor={`new-leisure-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
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
            <h3 className="text-sm font-medium text-foreground">Qualificação de Compra</h3>

            {/* Investidor Toggle */}
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <Controller name="is_investidor" control={control} render={({ field }) => (
                <Checkbox id="is_investidor" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label htmlFor="is_investidor" className="text-sm font-medium cursor-pointer">Cliente Investidor (compra recorrente)</Label>
            </div>

            {/* Payment Methods */}
            <div>
              <Label className="mb-2 block">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Controller name="forma_pagamento" control={control} render={({ field }) => (
                  <>
                    {FORMA_PAGAMENTO_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pay-${opt.value}`}
                          checked={field.value?.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                          }}
                        />
                        <Label htmlFor={`pay-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </>
                )} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urgência / Prazo</Label>
                <select {...register('urgencia')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione...</option>
                  {URGENCIA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Finalidade</Label>
                <select {...register('finalidade')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="">Selecione...</option>
                  {FINALIDADE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" placeholder="Informações adicionais..." rows={3} {...register('notes')} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="gradient-gold" disabled={createClient.isPending}>
              {createClient.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cadastrar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
