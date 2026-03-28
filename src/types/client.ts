export type ClientStage = 
  | 'lead'
  | 'qualification'
  | 'contact'
  | 'visit'
  | 'proposal'
  | 'negotiation'
  | 'closed'
  | 'quarantine'
  | 'lost';

export type ClientPriority = 'low' | 'medium' | 'high';

export type InteractionType = 'call' | 'email' | 'whatsapp' | 'visit' | 'meeting' | 'stage_change';

export interface ClientInteraction {
  id: string;
  client_id: string;
  type: InteractionType;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  stage: ClientStage;
  priority: ClientPriority;
  source: string | null;
  budget: string | null;
  preferred_region: string | null;
  property_type: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Detailed preferences
  budget_max: number | null;
  budget_min: number | null;
  bedrooms_min: number | null;
  parking_min: number | null;
  area_min: number | null;
  property_types: string[] | null;
  transaction_type: string | null;
  needs_leisure: boolean | null;
  leisure_features: string[] | null;
  region_flexible: boolean | null;
  // New fields
  urgencia: string | null;
  finalidade: string | null;
  forma_pagamento: string[] | null;
  elevator_preference: string | null;
  cidades: string[] | null;
  is_investidor: boolean;
  portaria_preferencia: string[] | null;
}

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'garden', label: 'Apartamento Garden' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'casa', label: 'Casa' },
  { value: 'casa_condominio', label: 'Casa em Condomínio' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'flat', label: 'Flat' },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'sale', label: 'Compra' },
  { value: 'rent', label: 'Aluguel' },
  { value: 'both', label: 'Compra ou Aluguel' },
];

export const LEISURE_FEATURE_OPTIONS = [
  { value: 'piscina', label: 'Piscina' },
  { value: 'academia', label: 'Academia' },
  { value: 'salao_festas', label: 'Salão de Festas' },
  { value: 'playground', label: 'Playground' },
  { value: 'quadra', label: 'Quadra Esportiva' },
  { value: 'churrasqueira', label: 'Churrasqueira' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'spa', label: 'Spa' },
  { value: 'coworking', label: 'Coworking' },
  { value: 'pet_place', label: 'Pet Place' },
  { value: 'brinquedoteca', label: 'Brinquedoteca' },
  { value: 'cinema', label: 'Cinema' },
];

export const URGENCIA_OPTIONS = [
  { value: 'imediato', label: 'Imediato' },
  { value: '3_meses', label: 'Até 3 meses' },
  { value: '6_meses', label: 'Até 6 meses' },
  { value: '1_ano', label: 'Até 1 ano' },
  { value: 'sem_pressa', label: 'Sem pressa' },
];

export const FINALIDADE_OPTIONS = [
  { value: 'moradia', label: 'Moradia' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'ambos', label: 'Ambos' },
];

export const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'a_vista', label: 'À Vista' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'permuta', label: 'Permuta' },
  { value: 'parcelamento', label: 'Parcelamento Direto' },
  { value: 'consorcio', label: 'Consórcio' },
];

export const ELEVATOR_OPTIONS = [
  { value: 'sim', label: 'Sim, obrigatório' },
  { value: 'nao', label: 'Não precisa' },
  { value: 'indiferente', label: 'Indiferente' },
];

export const PORTARIA_OPTIONS = [
  { value: '24h', label: 'Portaria 24h' },
  { value: 'diurna', label: 'Portaria Diurna' },
  { value: 'noturna', label: 'Portaria Noturna' },
  { value: 'virtual', label: 'Portaria Virtual' },
];

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  start_time: string;
  end_time: string;
  type: string;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: string;
  phone: string | null;
  whatsapp: string | null;
  manager_id: string | null;
  subscription_status: 'active' | 'pending' | 'canceled' | 'refunded' | null;
  kiwify_order_id: string | null;
  kiwify_payload: any | null;
  created_at: string;
  updated_at: string;
}

// Correct stage order as used in pipeline
export const STAGES_ORDER: ClientStage[] = ['lead', 'qualification', 'contact', 'visit', 'negotiation', 'proposal', 'closed', 'quarantine', 'lost'];

export const STAGE_LABELS: Record<ClientStage, string> = {
  lead: 'Novo Lead',
  qualification: 'Qualificação',
  contact: 'Perfil Definido',
  visit: 'Visita Agendada',
  proposal: 'Proposta Enviada',
  negotiation: 'Em Negociação',
  closed: 'Fechado',
  quarantine: 'Quarentena',
  lost: 'Desistência',
};

export const STAGE_COLORS: Record<ClientStage, string> = {
  lead: 'bg-stage-lead',
  qualification: 'bg-stage-qualification',
  contact: 'bg-stage-contact',
  visit: 'bg-stage-visit',
  proposal: 'bg-stage-proposal',
  negotiation: 'bg-stage-negotiation',
  closed: 'bg-stage-closed',
  quarantine: 'bg-stage-quarantine',
  lost: 'bg-stage-lost',
};

export const PRIORITY_LABELS: Record<ClientPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  call: 'Ligação',
  email: 'Email',
  whatsapp: 'WhatsApp',
  visit: 'Visita',
  meeting: 'Reunião',
  stage_change: 'Mudança de Estágio',
};
