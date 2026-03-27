import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientProfile {
  id: string;
  name: string;
  budget_max: number | null;
  bedrooms_min: number | null;
  parking_min: number | null;
  area_min: number | null;
  property_types: string[] | null;
  preferred_region: string | null;
  transaction_type: string | null;
  needs_leisure: boolean | null;
  leisure_features: string[] | null;
  notes: string | null;
  budget: string | null;
  region_flexible: boolean | null;
}

interface Property {
  id: string;
  codigo: string;
  slug: string;
  titulo: string | null;
  tipo: string | null;
  categoria: string | null;
  valor: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area_util: number | null;
  area_total: number | null;
  bairro: string | null;
  cidade: string | null;
  fotos: unknown;
  caracteristicas: unknown;
  descricao: string | null;
}

interface MatchResult {
  id: string;
  matchScore: number;
  matchReasons: string[];
  aiAnalysis: string;
}

interface FilterCriteria {
  budgetOk: boolean;
  bedroomsOk: boolean;
  parkingOk: boolean;
  areaOk: boolean;
  regionOk: boolean;
  typeOk: boolean;
}

// ========================================
// MAPEAMENTO DE REGIÕES DE BELO HORIZONTE
// ========================================
// Cada região contém seus bairros. Um cliente que busca em bairros da Centro-Sul
// NUNCA deve receber imóveis da Pampulha, Venda Nova, etc.

const BH_REGIONS: Record<string, string[]> = {
  'centro-sul': [
    'lourdes', 'funcionarios', 'santo agostinho', 'savassi', 'sion', 'serra', 
    'anchieta', 'carmo', 'cruzeiro', 'santo antonio', 'santa efigenia', 
    'luxemburgo', 'cidade jardim', 'mangabeiras', 'belvedere', 'vila paris',
    'santa lúcia', 'santa lucia', 'são pedro', 'sao pedro', 'centro',
    'barro preto', 'boa viagem', 'coração eucarístico', 'coracao eucaristico',
    'padre eustáquio', 'padre eustaquio', 'carlos prates', 'gutierrez',
    'estoril', 'buritis', 'nova suíça', 'nova suica', 'nova granada'
  ],
  'pampulha': [
    'pampulha', 'bandeirantes', 'castelo', 'ouro preto', 'itapoã', 'itapoa',
    'liberdade', 'são luiz', 'sao luiz', 'santa amélia', 'santa amelia',
    'jaraguá', 'jaragua', 'santa mônica', 'santa monica', 'dona clara',
    'aeroporto', 'planalto', 'universitário', 'universitario', 'indaiá', 'indaia',
    'braúnas', 'braunas', 'garças', 'garcas', 'santa branca', 'santa rosa',
    'alípio de melo', 'alipio de melo', 'caiçara', 'caicara'
  ],
  'nordeste': [
    'santa inês', 'santa ines', 'renascença', 'renascenca', 'sagrada família', 
    'sagrada familia', 'são geraldo', 'sao geraldo', 'horto', 'floresta',
    'santa tereza', 'santa teresa', 'pompeia', 'pompéia', 'nova floresta',
    'cidade nova', 'lagoinha', 'concórdia', 'concordia', 'cachoeirinha',
    'são cristóvão', 'sao cristovao', 'ipiranga'
  ],
  'noroeste': [
    'carlos prates', 'padre eustáquio', 'padre eustaquio', 'caiçara', 'caicara',
    'glória', 'gloria', 'prado', 'calafate', 'nova cachoeirinha',
    'são francisco', 'sao francisco', 'alto dos pinheiros'
  ],
  'oeste': [
    'gutierrez', 'buritis', 'estoril', 'nova suíça', 'nova suica',
    'nova granada', 'jardim américa', 'jardim america', 'gameleira',
    'cabana', 'betânia', 'betania', 'salgado filho', 'havaí', 'havai'
  ],
  'barreiro': [
    'barreiro', 'bairro das indústrias', 'bairro das industrias',
    'milionários', 'milionarios', 'lindéia', 'lindeia', 'tirol',
    'diamante', 'flávio marques lisboa', 'flavio marques lisboa'
  ],
  'venda-nova': [
    'venda nova', 'candelária', 'candelaria', 'rio branco', 'mantiqueira',
    'piratininga', 'santa mônica', 'santa monica', 'céu azul', 'ceu azul',
    'jardim leblon', 'lagoinha leblon'
  ],
  'norte': [
    'tupi', 'floramar', 'primeiro de maio', 'guarani', 'heliópolis', 'heliopolis',
    'são bernardo', 'sao bernardo', 'jaqueline', 'juliana'
  ],
  'leste': [
    'santa efigênia', 'santa efigenia', 'alto vera cruz', 'taquaril',
    'granja de freitas', 'pompéia', 'pompeia', 'vera cruz'
  ],
  'nova-lima': [
    'vila da serra', 'vale do sereno', 'jardim canadá', 'jardim canada',
    'alphaville', 'macacos', 'centro nova lima'
  ]
};

// Normaliza texto para comparação
function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Encontra a região de um bairro
function findRegion(bairro: string): string | null {
  const normalized = normalizeText(bairro);
  
  for (const [region, neighborhoods] of Object.entries(BH_REGIONS)) {
    for (const neighborhood of neighborhoods) {
      const normalizedNeighborhood = normalizeText(neighborhood);
      if (normalized.includes(normalizedNeighborhood) || normalizedNeighborhood.includes(normalized)) {
        return region;
      }
    }
  }
  return null;
}

// Extrai todos os bairros mencionados pelo cliente
function extractClientNeighborhoods(clientRegion: string): string[] {
  const normalized = normalizeText(clientRegion);
  const foundNeighborhoods: string[] = [];
  
  // Procura por cada bairro conhecido no texto do cliente
  for (const neighborhoods of Object.values(BH_REGIONS)) {
    for (const neighborhood of neighborhoods) {
      const normalizedNeighborhood = normalizeText(neighborhood);
      if (normalized.includes(normalizedNeighborhood)) {
        foundNeighborhoods.push(normalizedNeighborhood);
      }
    }
  }
  
  return foundNeighborhoods;
}

// Encontra todas as regiões que o cliente está buscando
function findClientRegions(clientRegion: string): Set<string> {
  const clientNeighborhoods = extractClientNeighborhoods(clientRegion);
  const regions = new Set<string>();
  
  for (const neighborhood of clientNeighborhoods) {
    const region = findRegion(neighborhood);
    if (region) {
      regions.add(region);
    }
  }
  
  return regions;
}

// Verifica se o bairro do imóvel é compatível com a preferência do cliente
// region_flexible = true: aceita toda a região
// region_flexible = false: apenas bairros específicos mencionados
function areNeighborhoodsCompatible(clientRegion: string, propertyBairro: string, regionFlexible: boolean = false): boolean {
  const normalizedProperty = normalizeText(propertyBairro);
  
  // 1. Match DIRETO - o bairro está literalmente mencionado (sempre válido)
  const clientNeighborhoods = extractClientNeighborhoods(clientRegion);
  for (const neighborhood of clientNeighborhoods) {
    if (normalizedProperty.includes(neighborhood) || neighborhood.includes(normalizedProperty)) {
      return true;
    }
  }
  
  // 2. Se region_flexible = false, APENAS bairros específicos são aceitos
  if (!regionFlexible) {
    console.log(`Strict neighborhood mode: Client wants specific neighborhoods only, ${propertyBairro} not in list`);
    // Se não especificou nenhum bairro conhecido, NÃO podemos validar com segurança.
    // Para evitar alucinações (ex: cliente digitou apenas "Centro-Sul"), seja restritivo.
    return false;
  }
  
  // 3. Se region_flexible = true, aceita toda a região
  const clientRegions = findClientRegions(clientRegion);
  
  // Se não encontrou nenhuma região conhecida, não pode validar
  if (clientRegions.size === 0) {
    console.log(`Unknown client region: ${clientRegion}`);
    return false; // Ser restritivo quando não conhece a região
  }
  
  const propertyRegion = findRegion(propertyBairro);
  
  // Se o imóvel está em região desconhecida, rejeita
  if (!propertyRegion) {
    console.log(`Unknown property neighborhood: ${propertyBairro}`);
    return false;
  }
  
  // Imóvel só é válido se estiver em uma das regiões do cliente
  const isCompatible = clientRegions.has(propertyRegion);
  
  if (!isCompatible) {
    console.log(`Region mismatch: Client wants [${Array.from(clientRegions).join(', ')}], property is in [${propertyRegion}] (${propertyBairro})`);
  }
  
  return isCompatible;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client } = await req.json() as { client: ClientProfile };
    
    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Client profile is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========================================
    // FILTROS RÍGIDOS - PRÉ-FILTRAGEM NO BANCO
    // ========================================
    // Estes filtros são OBRIGATÓRIOS e não podem ser ignorados pela IA
    
    let query = supabase
      .from('imoveis')
      .select('id, codigo, slug, titulo, tipo, categoria, valor, quartos, suites, banheiros, vagas, area_util, area_total, bairro, cidade, fotos, caracteristicas, descricao')
      .eq('ativo', true);
    
    // FILTRO 1: ORÇAMENTO MÁXIMO (tolerância de 10% acima)
    // Se cliente tem orçamento de 900k, máximo aceito é 990k
    if (client.budget_max && client.budget_max > 0) {
      const maxBudgetWithTolerance = client.budget_max * 1.10;
      query = query.lte('valor', maxBudgetWithTolerance);
      console.log(`Budget filter: max R$ ${maxBudgetWithTolerance.toLocaleString('pt-BR')}`);
    }
    
    // FILTRO 2: QUARTOS MÍNIMOS (obrigatório - sem tolerância)
    // Se cliente quer 4 quartos, só mostra imóveis com 4+ quartos
    if (client.bedrooms_min && client.bedrooms_min > 0) {
      query = query.gte('quartos', client.bedrooms_min);
      console.log(`Bedrooms filter: min ${client.bedrooms_min} quartos`);
    }
    
    // FILTRO 3: VAGAS MÍNIMAS (obrigatório)
    if (client.parking_min && client.parking_min > 0) {
      query = query.gte('vagas', client.parking_min);
      console.log(`Parking filter: min ${client.parking_min} vagas`);
    }
    
    // FILTRO 4: ÁREA MÍNIMA (tolerância de 10% abaixo)
    if (client.area_min && client.area_min > 0) {
      const minAreaWithTolerance = client.area_min * 0.9;
      query = query.gte('area_util', minAreaWithTolerance);
      console.log(`Area filter: min ${minAreaWithTolerance}m²`);
    }
    
    // Limite de imóveis para análise
    query = query.limit(150);

    const { data: allProperties, error: propError } = await query;

    if (propError) {
      console.error('Error fetching properties:', propError);
      throw new Error('Failed to fetch properties');
    }

    if (!allProperties || allProperties.length === 0) {
      console.log('No properties found after rigid filters');
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${allProperties.length} properties after database filters`);

    // ========================================
    // FILTRO DE REGIÃO - PÓS-PROCESSAMENTO
    // ========================================
    // Filtra por região considerando bairros similares
    // region_flexible controla se aceita toda a região ou apenas bairros específicos
    let properties = allProperties;
    const regionFlexible = client.region_flexible ?? false;
    
    console.log(`Region flexibility mode: ${regionFlexible ? 'FLEXIBLE (entire region)' : 'STRICT (specific neighborhoods only)'}`);
    
    if (client.preferred_region && client.preferred_region.trim()) {
      const filteredByRegion = allProperties.filter(p => {
        if (!p.bairro) return false;
        return areNeighborhoodsCompatible(client.preferred_region!, p.bairro, regionFlexible);
      });
      
      // Se encontrou imóveis na região, usa eles.
      // Se não encontrou, retorna vazio (NÃO fazer fallback para outros bairros/regiões).
      if (filteredByRegion.length > 0) {
        properties = filteredByRegion;
        console.log(`Region filter: ${filteredByRegion.length} properties in compatible neighborhoods`);
      } else {
        console.log('No properties in preferred region; returning empty to avoid out-of-region suggestions');
        return new Response(
          JSON.stringify({ matches: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ========================================
    // FILTRO DE TIPO DE IMÓVEL - PÓS-PROCESSAMENTO
    // ========================================
    if (client.property_types && client.property_types.length > 0) {
      const normalizedTypes = client.property_types.map(normalizeText);
      
      const filteredByType = properties.filter(p => {
        if (!p.tipo && !p.categoria) return false;
        const propTipo = normalizeText(p.tipo || '');
        const propCategoria = normalizeText(p.categoria || '');
        
        return normalizedTypes.some(t => 
          propTipo.includes(t) || t.includes(propTipo) ||
          propCategoria.includes(t) || t.includes(propCategoria)
        );
      });
      
      if (filteredByType.length > 0) {
        properties = filteredByType;
        console.log(`Type filter: ${filteredByType.length} properties matching type preferences`);
      }
    }

    if (properties.length === 0) {
      console.log('No properties after all filters');
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Final ${properties.length} properties for AI analysis`);

    // Build the client profile summary for AI
    const clientSummary = buildClientSummary(client);
    const propertiesSummary = buildPropertiesSummary(properties);

    // Call Lovable AI for intelligent ranking (NOT filtering - filtering was done above)
    const prompt = `Você é um corretor de imóveis de alto padrão. Sua tarefa é RANQUEAR os imóveis já pré-filtrados.

IMPORTANTE: Todos os imóveis abaixo JÁ PASSARAM por filtros obrigatórios de orçamento, quartos, vagas e área.
Você NÃO precisa filtrar novamente. Apenas RANQUEIE pela compatibilidade geral.

PERFIL DO CLIENTE:
${clientSummary}

IMÓVEIS PRÉ-FILTRADOS (${properties.length} imóveis que atendem requisitos mínimos):
${propertiesSummary}

TAREFA:
Ranqueie os imóveis do MELHOR para o PIOR match com base em:
1. Aderência à região preferida (bairros mais desejados = score maior)
2. Valor mais próximo do orçamento (não acima, mas próximo = melhor)
3. Características de lazer desejadas
4. Perfil geral mencionado nas notas
5. Qualidade e acabamento implícito no título/descrição

REGRAS ESTRITAS:
- matchScore de 60-100 (todos já passaram filtros, mínimo é 60)
- Score 90-100: Match excelente (região perfeita + tudo alinhado)
- Score 80-89: Match muito bom (pequenas diferenças)
- Score 70-79: Match bom (atende bem, mas há opções melhores)
- Score 60-69: Match aceitável (atende requisitos básicos)
- Retorne TODOS os imóveis ranqueados (máximo ${Math.min(properties.length, 15)})
- matchReasons: lista curta de pontos fortes (max 3)
- aiAnalysis: 1 frase explicando por que é um bom match

Retorne APENAS JSON válido:
{
  "matches": [
    {
      "id": "uuid-do-imovel",
      "matchScore": 85,
      "matchReasons": ["Região ideal", "Dentro do orçamento", "Lazer completo"],
      "aiAnalysis": "Apartamento no Lourdes com excelente custo-benefício"
    }
  ]
}`;

    console.log('Calling Lovable AI for ranking...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.1, // Baixa temperatura para respostas mais consistentes
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        // Fallback to basic matching on rate limit
        console.log('Rate limited, using fallback matching');
        const fallbackResults = fallbackMatching(client, properties);
        const enrichedFallback = enrichResults(fallbackResults, properties, client);
        return new Response(
          JSON.stringify({ matches: enrichedFallback }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Fallback on any AI error
      const fallbackResults = fallbackMatching(client, properties);
      const enrichedFallback = enrichResults(fallbackResults, properties, client);
      return new Response(
        JSON.stringify({ matches: enrichedFallback }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    console.log('AI Response received, parsing...');

    // Parse AI response
    let matchResults: MatchResult[] = [];
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*"matches"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        matchResults = parsed.matches || [];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      // Fall back to basic matching
      matchResults = fallbackMatching(client, properties);
    }

    // If AI returned empty, use fallback
    if (matchResults.length === 0) {
      matchResults = fallbackMatching(client, properties);
    }

    const enrichedMatches = enrichResults(matchResults, properties, client);

    console.log(`Returning ${enrichedMatches.length} matched properties`);

    return new Response(
      JSON.stringify({ matches: enrichedMatches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Match error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function enrichResults(matchResults: MatchResult[], properties: Property[], client: ClientProfile) {
  return matchResults
    .map(match => {
      const property = properties.find(p => p.id === match.id);
      if (!property) return null;
      
      // Calculate which filter criteria this property meets
      const filterCriteria = calculateFilterCriteria(property, client);
      
      return {
        ...property,
        fotos: property.fotos as string[] | null,
        caracteristicas: property.caracteristicas as string[] | null,
        matchScore: Math.min(100, Math.max(60, match.matchScore)),
        matchReasons: match.matchReasons || [],
        aiAnalysis: match.aiAnalysis || '',
        filterCriteria,
      };
    })
    .filter(Boolean)
    .slice(0, 15);
}

function calculateFilterCriteria(property: Property, client: ClientProfile): FilterCriteria {
  const criteria: FilterCriteria = {
    budgetOk: true,
    bedroomsOk: true,
    parkingOk: true,
    areaOk: true,
    regionOk: true,
    typeOk: true,
  };
  
  // Budget check
  if (client.budget_max && client.budget_max > 0 && property.valor) {
    criteria.budgetOk = property.valor <= client.budget_max * 1.10;
  }
  
  // Bedrooms check
  if (client.bedrooms_min && client.bedrooms_min > 0 && property.quartos) {
    criteria.bedroomsOk = property.quartos >= client.bedrooms_min;
  }
  
  // Parking check
  if (client.parking_min && client.parking_min > 0 && property.vagas) {
    criteria.parkingOk = property.vagas >= client.parking_min;
  }
  
  // Area check
  if (client.area_min && client.area_min > 0 && property.area_util) {
    criteria.areaOk = property.area_util >= client.area_min * 0.9;
  }
  
  // Region check
  if (client.preferred_region && client.preferred_region.trim() && property.bairro) {
    const regionFlexible = client.region_flexible ?? false;
    criteria.regionOk = areNeighborhoodsCompatible(client.preferred_region, property.bairro, regionFlexible);
  }
  
  // Type check
  if (client.property_types && client.property_types.length > 0) {
    const normalizedTypes = client.property_types.map(normalizeText);
    const propTipo = normalizeText(property.tipo || '');
    const propCategoria = normalizeText(property.categoria || '');
    criteria.typeOk = normalizedTypes.some(t => 
      propTipo.includes(t) || t.includes(propTipo) ||
      propCategoria.includes(t) || t.includes(propCategoria)
    );
  }
  
  return criteria;
}

function buildClientSummary(client: ClientProfile): string {
  const lines: string[] = [];
  
  lines.push(`Nome: ${client.name}`);
  
  if (client.budget_max) {
    lines.push(`Orçamento máximo: R$ ${client.budget_max.toLocaleString('pt-BR')}`);
  } else if (client.budget) {
    lines.push(`Orçamento (texto): ${client.budget}`);
  }
  
  if (client.bedrooms_min) {
    lines.push(`Mínimo de quartos: ${client.bedrooms_min}`);
  }
  
  if (client.parking_min) {
    lines.push(`Mínimo de vagas: ${client.parking_min}`);
  }
  
  if (client.area_min) {
    lines.push(`Área mínima: ${client.area_min}m²`);
  }
  
  if (client.property_types && client.property_types.length > 0) {
    lines.push(`Tipos de imóvel: ${client.property_types.join(', ')}`);
  }
  
  if (client.preferred_region) {
    const flexibilityNote = client.region_flexible 
      ? ' (aceita região inteira)' 
      : ' (apenas bairros específicos)';
    lines.push(`Região de preferência: ${client.preferred_region}${flexibilityNote}`);
  }
  
  if (client.transaction_type) {
    const typeLabel = client.transaction_type === 'sale' ? 'Compra' : 
                      client.transaction_type === 'rent' ? 'Aluguel' : 'Compra ou Aluguel';
    lines.push(`Tipo de transação: ${typeLabel}`);
  }
  
  if (client.needs_leisure && client.leisure_features && client.leisure_features.length > 0) {
    lines.push(`Itens de lazer desejados: ${client.leisure_features.join(', ')}`);
  }
  
  if (client.notes) {
    lines.push(`Observações/Perfil: ${client.notes}`);
  }
  
  return lines.join('\n');
}

function buildPropertiesSummary(properties: Property[]): string {
  return properties.map((p, idx) => {
    const lines: string[] = [];
    lines.push(`[${idx + 1}] ID: ${p.id}`);
    lines.push(`   Título: ${p.titulo || p.codigo}`);
    lines.push(`   Tipo: ${p.tipo || 'N/I'} | Categoria: ${p.categoria || 'N/I'}`);
    if (p.valor) lines.push(`   Valor: R$ ${p.valor.toLocaleString('pt-BR')}`);
    if (p.quartos) lines.push(`   Quartos: ${p.quartos}${p.suites ? ` (${p.suites} suítes)` : ''}`);
    if (p.vagas) lines.push(`   Vagas: ${p.vagas}`);
    if (p.area_util) lines.push(`   Área útil: ${p.area_util}m²`);
    if (p.bairro || p.cidade) lines.push(`   Local: ${p.bairro || ''}${p.bairro && p.cidade ? ', ' : ''}${p.cidade || ''}`);
    
    // Include some characteristics for leisure matching
    const chars = p.caracteristicas as string[] | null;
    if (chars && chars.length > 0) {
      const leisureKeywords = ['piscina', 'academia', 'playground', 'churrasqueira', 'salão', 'sauna', 'spa', 'quadra', 'pet'];
      const leisureChars = chars.filter(c => 
        leisureKeywords.some(k => c.toLowerCase().includes(k))
      );
      if (leisureChars.length > 0) {
        lines.push(`   Lazer: ${leisureChars.slice(0, 5).join(', ')}`);
      }
    }
    
    return lines.join('\n');
  }).join('\n\n');
}

// Fallback matching if AI fails - now only ranks pre-filtered properties
function fallbackMatching(client: ClientProfile, properties: Property[]): MatchResult[] {
  const results: MatchResult[] = [];
  
  for (const p of properties) {
    // Nunca sugerir fora da região/bairros preferidos no fallback.
    if (client.preferred_region && client.preferred_region.trim()) {
      if (!p.bairro) continue;
      const regionFlexible = client.region_flexible ?? false;
      const compatible = areNeighborhoodsCompatible(client.preferred_region, p.bairro, regionFlexible);
      if (!compatible) continue;
    }

    // Base score starts at 60 since all properties already passed filters
    let score = 60;
    const reasons: string[] = [];
    
    // Bonus for being under budget
    if (client.budget_max && p.valor) {
      const budgetRatio = p.valor / client.budget_max;
      if (budgetRatio <= 0.8) {
        score += 15;
        reasons.push('Excelente custo-benefício');
      } else if (budgetRatio <= 1.0) {
        score += 10;
        reasons.push('Dentro do orçamento');
      } else {
        score += 5;
        reasons.push('Próximo do orçamento');
      }
    }
    
    // Bonus for matching region
    if (client.preferred_region && p.bairro) {
      const regionFlexible = client.region_flexible ?? false;
      if (areNeighborhoodsCompatible(client.preferred_region, p.bairro, regionFlexible)) {
        score += 15;
        reasons.push(`Região: ${p.bairro}`);
      }
    }
    
    // Bonus for exceeding bedroom requirement
    if (client.bedrooms_min && p.quartos && p.quartos > client.bedrooms_min) {
      score += 5;
      reasons.push(`${p.quartos} quartos`);
    }
    
    // Bonus for suites
    if (p.suites && p.suites > 0) {
      score += 5;
    }
    
    results.push({
      id: p.id,
      matchScore: Math.min(100, score),
      matchReasons: reasons.slice(0, 3),
      aiAnalysis: 'Match baseado nos critérios do perfil do cliente.',
    });
  }
  
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 15);
}
