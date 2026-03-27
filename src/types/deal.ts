export type DealClientStage =
  | 'enviado'
  | 'agendar_visita'
  | 'visita_agendada'
  | 'visitou'
  | 'em_negociacao'
  | 'vendido'
  | 'nao_interessa'
  | 'preco_alto'
  | 'fora_do_perfil';

export const DEAL_CLIENT_STAGES_ORDER: DealClientStage[] = [
  'enviado', 'agendar_visita', 'visita_agendada', 'visitou', 'em_negociacao', 'vendido',
];

export const DEAL_CLIENT_LOST_STAGES: DealClientStage[] = [
  'nao_interessa', 'preco_alto', 'fora_do_perfil',
];

export const DEAL_CLIENT_STAGE_LABELS: Record<DealClientStage, string> = {
  enviado: 'Enviado',
  agendar_visita: 'Agendar Visita',
  visita_agendada: 'Visita Agendada',
  visitou: 'Visitou',
  em_negociacao: 'Em Negociação',
  vendido: 'Vendido',
  nao_interessa: 'Não Interessa',
  preco_alto: 'Preço Alto',
  fora_do_perfil: 'Fora do Perfil',
};

export const DEAL_CLIENT_STAGE_COLORS: Record<DealClientStage, string> = {
  enviado: 'bg-blue-500',
  agendar_visita: 'bg-amber-500',
  visita_agendada: 'bg-teal-500',
  visitou: 'bg-purple-500',
  em_negociacao: 'bg-orange-500',
  vendido: 'bg-emerald-500',
  nao_interessa: 'bg-gray-400',
  preco_alto: 'bg-red-400',
  fora_do_perfil: 'bg-red-300',
};

export type DealStatus = 'active' | 'sold' | 'cancelled';

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  active: 'Ativo',
  sold: 'Vendido',
  cancelled: 'Cancelado',
};

export const PROPERTY_TYPE_OPTIONS_DEAL = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'casa', label: 'Casa' },
  { value: 'casa_condominio', label: 'Casa em Condomínio' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'flat', label: 'Flat' },
];

export const LAZER_OPTIONS = [
  'Piscina', 'Academia', 'Salão de Festas', 'Playground',
  'Quadra Esportiva', 'Churrasqueira', 'Sauna', 'Spa',
  'Coworking', 'Pet Place', 'Brinquedoteca', 'Cinema',
];

export const PORTARIA_OPTIONS = [
  { value: 'portaria_24h', label: 'Portaria 24h' },
  { value: 'portaria_diurna', label: 'Portaria Diurna' },
  { value: 'portaria_noturna', label: 'Portaria Noturna' },
  { value: 'portaria_virtual', label: 'Portaria Virtual' },
];

export const PORTARIA_LABELS: Record<string, string> = {
  portaria_24h: 'Portaria 24h',
  portaria_diurna: 'Portaria Diurna',
  portaria_noturna: 'Portaria Noturna',
  portaria_virtual: 'Portaria Virtual',
};

export interface Deal {
  id: string;
  listing_url: string | null;
  title: string | null;
  listing_image_url: string | null;
  listing_description: string | null;
  valor: number | null;
  metragem: number | null;
  tipo: string | null;
  quartos: number | null;
  suites: number | null;
  salas: number | null;
  cozinhas: number | null;
  banheiros: number | null;
  vagas: number | null;
  elevador_social: boolean;
  elevador_servico: boolean;
  portaria: string | null;
  area_lazer: string[];
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  codigo_imovel: string | null;
  comissao_percentual: number;
  tem_parceria: boolean;
  proprietario_nome: string | null;
  proprietario_whatsapp: string | null;
  proprietario_email: string | null;
  status: DealStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DealPartner {
  id: string;
  deal_id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
}

export interface DealClient {
  id: string;
  deal_id: string;
  client_id: string;
  stage: DealClientStage;
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
}

export interface DealProposal {
  id: string;
  deal_id: string;
  client_id: string;
  valor_proposta: number;
  composicao: ProposalComposition[];
  status: 'pending' | 'accepted' | 'rejected' | 'counter';
  created_by: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
  };
}

export interface ProposalComposition {
  tipo: 'a_vista' | 'financiamento' | 'permuta' | 'parcelamento';
  valor: number;
  detalhes?: string;
}

export const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  a_vista: 'À Vista',
  financiamento: 'Financiamento',
  permuta: 'Permuta',
  parcelamento: 'Parcelamento',
};

export interface DealInteraction {
  id: string;
  deal_id: string;
  type: string;
  description: string | null;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
}

export interface DealWithClients extends Deal {
  deal_clients: DealClient[];
  proposals_count?: number;
}
