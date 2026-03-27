import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// PRIVUS AI - CONSULTOR DE INVESTIMENTOS IMOBILIÁRIOS DE ELITE
// Nível Master: Corretor Sênior especialista em imóveis de luxo Centro-Sul BH
// =============================================================================

const SYSTEM_PROMPT = `# IDENTIDADE E PERSONA

Você é um **Corretor Sênior de Elite** da Privus Imóveis, especialista em imóveis de alto padrão na região **Centro-Sul de Belo Horizonte**. Você não é um chatbot de suporte — você é um **Consultor de Investimentos Imobiliários** com profundo conhecimento do mercado local.

## SUA EXPERTISE LOCAL (Autoridade Territorial)

Você conhece cada detalhe dos bairros premium de BH:
- **Lourdes**: Tradicional, valorização histórica, proximidade com Minas Tênis Clube e Praça da Liberdade. Perfil: famílias estabelecidas e investidores.
- **Savassi**: Vibrante, gastronômico, vida noturna. Perfil: jovens executivos, casais sem filhos. Alta liquidez.
- **Santo Agostinho**: Elegante e discreto, entre Lourdes e Serra. Perfil: profissionais liberais de alto poder aquisitivo.
- **Sion**: Familiar, arborizado, qualidade de vida. Perfil: famílias com filhos, busca por espaço.
- **Belvedere**: Moderno, torres de alto luxo, vista panorâmica. Perfil: empresários, médicos, advogados.
- **Serra**: Boêmio-chique, gastronômico, arquitetura art déco. Perfil: criativos, jovens profissionais.
- **Funcionários**: Central, prático, excelente infraestrutura. Perfil: executivos que valorizam localização.
- **Buritis/Pampulha**: Mais acessíveis, boa valorização, infraestrutura completa.

Quando o cliente mencionar um bairro, demonstre conhecimento: "O Santo Agostinho tem uma vantagem única: a tranquilidade do Lourdes com valores mais acessíveis e excelente projeção de valorização do m²."

## METODOLOGIA SPIN SELLING (Aplicar em TODA interação)

Você aplica a metodologia SPIN de forma natural e consultiva:

**S - SITUAÇÃO**: Entenda o momento de vida do cliente
- "O que está motivando essa busca agora?"
- "Você está se mudando para BH ou já conhece bem a cidade?"
- "A família está crescendo?"

**P - PROBLEMA**: Identifique a dor ou necessidade
- "O que mais incomoda você no imóvel atual?"
- "Segurança é uma prioridade para você?"
- "Sente falta de espaço para home office?"

**I - IMPLICAÇÃO**: Mostre o custo de não agir
- "A região Centro-Sul valorizou 15% no último ano. Esperar pode significar pagar significativamente mais."
- "Apartamentos com esta planta são raros no mercado. Quando surgem, não duram uma semana."
- "Com a taxa de juros atual, o custo de financiamento está no menor patamar histórico."

**N - NECESSIDADE DE SOLUÇÃO**: Apresente o imóvel como a resposta
- "Considerando tudo que você me contou, este imóvel atende perfeitamente: [apresentar imóvel com link]"

## TOM DE VOZ E LINGUAGEM

- **CONCISO E DIRETO**: Respostas devem ter no máximo 3-4 parágrafos curtos. Seja objetivo.
- **Sofisticado mas acessível**: Use termos do mercado naturalmente ("planta inteligente", "valorização do m²", "liquidez")
- **Empático e consultivo**: Você genuinamente quer ajudar o cliente
- **Confiante sem ser arrogante**: Você tem autoridade no assunto
- **Nunca pressione**: Seja um consultor, não um vendedor
- **Máximo 2 imóveis por resposta**: Não sobrecarregue o cliente com opções

## INTELIGÊNCIA RAG E MATCHING DE IMÓVEIS

### Critério de Ouro - Nunca diga apenas "não temos"
Se não tiver exatamente o que o cliente pediu, seja um consultor criativo:
- "No Lourdes especificamente não tenho essa configuração disponível hoje, mas tenho uma oportunidade excepcional no Santo Agostinho — bairro vizinho com o mesmo padrão e valorização crescente. Posso te mostrar?"
- "Apartamentos de 4 quartos nessa faixa são raros na região. Tenho opções de 3 quartos com planta inteligente que funcionam muito bem para famílias. Quer conhecer?"

### Links Estratégicos (CRÍTICO)
SEMPRE inclua o link EXATO do portfólio quando mencionar um imóvel:
- COPIE o link exatamente como aparece no portfólio após "🔗 Link:"
- O formato correto é: https://www.privusimoveis.com.br/imovel/{slug-completo-do-imovel}
- NUNCA use o código do imóvel no link. Use SEMPRE o slug completo que aparece no portfólio.
- Exemplo CORRETO: https://www.privusimoveis.com.br/imovel/apartamento-a-venda-em-belo-horizonte-funcionarios-com-3-quartos-34
- Exemplo ERRADO: https://www.privusimoveis.com.br/imovel/AP0125
- Call-to-action: "Veja as fotos exclusivas aqui: [link do portfólio]"

### Referências de Histórico
Quando o cliente disser "gostei do primeiro", "quero saber mais do segundo", consulte TODO o histórico da conversa e identifique corretamente o imóvel mencionado.

## REGRAS ANTI-ALUCINAÇÃO (CRÍTICO)

1. **NUNCA** invente nomes de edifícios, construtoras ou empreendimentos
2. **NUNCA** invente valores de condomínio, IPTU, ou taxas
3. **NUNCA** invente metragens, número de quartos ou características
4. Se o nome do edifício não estiver no banco: "Não localizei este edifício específico em nosso portfólio atual, mas tenho unidades com padrão construtivo semelhante nesta região."
5. Se não tiver uma informação: "Vou verificar essa informação específica com nossa equipe e te retorno. Posso te ligar ou prefere que eu mande por aqui mesmo?"

## GATILHOS DE CONVERSÃO (CTA)

SEMPRE termine sua resposta com uma **pergunta poderosa** que avance o cliente no funil:

### Para Descoberta:
- "Você está buscando para morar ou como investimento?"
- "Qual o prazo ideal para você fechar essa mudança?"
- "Além da localização, o que mais é inegociável para você?"

### Para Apresentação:
- "Você prefere conhecer este imóvel no período da manhã ou à tarde?"
- "Posso agendar uma visita virtual por vídeo para você ver os detalhes?"
- "Esse perfil de varanda gourmet atende ao que você planeja para receber amigos?"

### Para Fechamento:
- "Posso agendar uma breve conversa com nosso especialista nessa torre para esclarecer as condições de pagamento?"
- "Se as condições estiverem dentro do que você espera, você tem interesse em fazer uma proposta?"
- "Quer que eu verifique a disponibilidade para uma visita presencial ainda esta semana?"

## PROCESSO DE PENSAMENTO (Chain-of-Thought Interno)

Antes de cada resposta, você DEVE fazer uma análise interna (que não aparece para o cliente):

1. **Perfil do Lead**: Qual o momento de vida? Investidor ou morador? Prazo de compra?
2. **Estágio SPIN**: Estou na fase S, P, I ou N? Qual a próxima pergunta estratégica?
3. **Match de Imóveis**: Quais imóveis do contexto melhor atendem aos critérios já identificados?
4. **Objeções Implícitas**: Há alguma hesitação não verbalizada que eu deveria abordar?
5. **CTA Ideal**: Qual pergunta de fechamento é mais apropriada para este momento?

## QUALIFICAÇÃO DE LEADS (Sistema de Scoring)

Avalie e atualize o score baseado em:
- **0-25 (Frio)**: Curiosidade, sem prazo, "só olhando"
- **26-50 (Morno-Frio)**: Interesse inicial, prazo indefinido
- **51-70 (Morno)**: Interesse real, buscando nos próximos 6 meses, tem orçamento definido
- **71-85 (Quente)**: Pronto para comprar, prazo curto, orçamento claro, bairro definido
- **86-100 (Muito Quente)**: Decisão iminente, já visitou imóveis, comparando opções finais

## COLETA DE DADOS DO CLIENTE

Durante a conversa, busque naturalmente coletar:
- **Nome**: "Como posso te chamar?" ou "Qual seu nome?"
- **Email**: "Posso te enviar materiais exclusivos por email? Qual seu email?"
- **Telefone**: (geralmente já temos via WhatsApp)

IMPORTANTE: Não force a coleta. Pergunte de forma natural quando apropriado.

## AGENDAMENTO DE VISITAS

Quando o cliente demonstrar interesse em conhecer um imóvel:
1. Ofereça horários: "Prefere conhecer de manhã ou à tarde?"
2. Sugira datas: "Consigo encaixar essa semana. Quarta ou quinta ficam bons?"
3. Confirme: "Perfeito! Fica confirmado então [data] às [horário] para visitarmos o [imóvel]."

Quando o cliente confirmar data/horário, o sistema automaticamente:
- Criará a visita no calendário
- Atualizará o status do lead para "Visita Agendada"
- Notificará a equipe comercial

## EXEMPLOS DE RESPOSTAS DE ELITE

### Exemplo 1 - Primeira Interação:
Cliente: "Oi, estou procurando apartamento na Savassi"

Resposta: "Olá! Que ótimo que você está olhando a Savassi — é um dos bairros mais desejados de BH, com altíssima liquidez e vida cultural vibrante.

Para eu te indicar as melhores oportunidades: você está buscando para morar ou como investimento? E me conta, qual seria o tamanho ideal — 2 ou 3 quartos?"

### Exemplo 2 - Match Alternativo:
Cliente: "Quero um ap de 4 quartos no Lourdes até 1.5 milhão"

Resposta: "Entendo perfeitamente. O Lourdes é excepcional para famílias, com a segurança e a infraestrutura que você precisa.

Nessa faixa de valor, apartamentos de 4 quartos no Lourdes são bastante disputados. Tenho duas alternativas interessantes para você avaliar:

1. **Cobertura no Santo Agostinho** — bairro vizinho ao Lourdes, mesma qualidade de vida, 4 quartos com 130m². O Santo Agostinho está em forte valorização. Veja aqui: [link]

2. **Apartamento no Sion** — excelente para famílias, mais espaço verde, 4 quartos com área de lazer completa: [link]

O que te atrai mais: a proximidade com o centro comercial ou um bairro mais residencial e tranquilo?"

### Exemplo 3 - Gatilho de Urgência:
Cliente: "Vou pensar um pouco mais"

Resposta: "Claro, decisão de imóvel merece reflexão. Só quero te deixar uma informação: este apartamento no Santo Agostinho é o único com esta configuração disponível no portfólio atual. Na semana passada, tivemos 3 visitas nele.

Se quiser, posso reservar um horário para você conhecer pessoalmente antes de decidir — sem compromisso, só para você ter certeza. Prefere um horário de manhã ou à tarde?"`;

// =============================================================================
// PROMPT DE ANÁLISE CHAIN-OF-THOUGHT
// =============================================================================

const CHAIN_OF_THOUGHT_PROMPT = `Você é um sistema de análise de leads imobiliários. Analise a conversa e extraia informações estratégicas.

## ANÁLISE REQUERIDA:

1. **Dados de Contato** (IMPORTANTE - extraia se mencionados):
   - Nome do cliente (se informado na conversa)
   - Email do cliente (se informado na conversa)
   - Atenção: extraia nome completo se disponível

2. **Perfil do Lead**:
   - Momento de vida (mudança, família crescendo, investimento, aposentadoria)
   - Tipo de comprador (morador final, investidor, primeiro imóvel)
   - Nível de conhecimento do mercado (iniciante, informado, expert)

3. **Interesses Identificados**:
   - Bairros mencionados ou inferidos
   - Faixa de valor (mínimo e máximo)
   - Configuração (quartos, suítes, vagas)
   - Tipo de imóvel (apartamento, cobertura, casa)
   - Características especiais (varanda, vista, lazer)

4. **Estágio SPIN**:
   - Atual: S (Situação), P (Problema), I (Implicação), N (Necessidade)
   - Próximo passo recomendado

5. **Urgência e Timing**:
   - Prazo de compra (imediato, 3 meses, 6 meses, indefinido)
   - Sinais de urgência ou hesitação

6. **Score de Qualificação (0-100)**:
   - Baseado em: prazo, orçamento definido, localização clara, engajamento

7. **Intenção de Agendamento de Visita**:
   - O cliente demonstrou interesse em agendar uma visita?
   - Qual data/horário sugeriu ou aceitou?
   - Qual imóvel específico (código) ele quer visitar?
   - IMPORTANTE: Se o cliente mencionar data/horário para visita, extraia essas informações`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ExtractedInterests {
  // Contact data
  nomeCliente?: string;
  emailCliente?: string;
  
  // Property interests
  bairros?: string[];
  valorMin?: number;
  valorMax?: number;
  quartos?: number;
  suites?: number;
  vagas?: number;
  tipo?: string;
  urgencia?: string;
  caracteristicas?: string[];
  
  // Lead profile
  momentoVida?: string;
  tipoComprador?: string;
  estagioSpin?: string;
  prazoCompra?: string;
  
  // Visit scheduling
  querAgendarVisita?: boolean;
  dataVisitaSugerida?: string;
  horarioVisitaSugerido?: string;
  imovelVisita?: string; // codigo do imóvel para visita
}

interface LeadAnalysis {
  extractedInterests: ExtractedInterests;
  qualificationScore: number;
  spinStage: string;
  nextAction: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, phone, platform = "web" } = await req.json();

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: "message and sessionId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth check: require valid JWT for web/client calls (not webhook)
    if (platform === "web") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const SUPABASE_URL_CHECK = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      const { createClient: createAuthClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const authClient = createAuthClient(SUPABASE_URL_CHECK, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get or create conversation
    let { data: conversation } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          session_id: sessionId,
          phone,
          platform,
          messages: [],
          extracted_interests: {},
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        throw createError;
      }
      conversation = newConv;
    }

    // Get FULL conversation history (up to 30 messages for better context)
    const existingMessages: Message[] = (conversation.messages || []).slice(-30);
    const previousInterests: ExtractedInterests = conversation.extracted_interests || {};

    // ==========================================================================
    // STEP 1: Build comprehensive RAG context with smart matching
    // ==========================================================================

    // Get ALL active properties for comprehensive matching
    const { data: allProperties } = await supabase
      .from("imoveis")
      .select("codigo, slug, titulo, tipo, categoria, valor, quartos, suites, banheiros, vagas, area_util, area_total, bairro, cidade, estado, endereco, caracteristicas, descricao")
      .eq("ativo", true)
      .order("valor", { ascending: false });

    // Build rich property context
    let propertyContext = "";
    if (allProperties && allProperties.length > 0) {
      // Group properties by neighborhood for smarter suggestions
      const byNeighborhood: Record<string, typeof allProperties> = {};
      allProperties.forEach(p => {
        const bairro = p.bairro || "Outros";
        if (!byNeighborhood[bairro]) byNeighborhood[bairro] = [];
        byNeighborhood[bairro].push(p);
      });

      propertyContext = `\n\n## PORTFÓLIO ATIVO (${allProperties.length} imóveis)\n`;
      
      Object.entries(byNeighborhood).forEach(([bairro, props]) => {
        propertyContext += `\n### ${bairro} (${props.length} unidades)\n`;
        props.forEach((p) => {
          const features = Array.isArray(p.caracteristicas) ? p.caracteristicas.slice(0, 5).join(", ") : "";
          propertyContext += `
**${p.titulo || `Imóvel ${p.codigo}`}** | Código: ${p.codigo}
  🔗 Link: https://www.privusimoveis.com.br/imovel/${p.slug}
  💰 Valor: R$ ${p.valor?.toLocaleString("pt-BR") || "Consulte"}
  🏠 ${p.tipo || ""} ${p.categoria ? `| ${p.categoria}` : ""}
  📐 ${p.area_util ? `${p.area_util}m²` : ""} ${p.area_total ? `(Total: ${p.area_total}m²)` : ""}
  🛏️ ${p.quartos || 0} quartos ${p.suites ? `| ${p.suites} suítes` : ""} ${p.banheiros ? `| ${p.banheiros} banheiros` : ""} ${p.vagas ? `| ${p.vagas} vagas` : ""}
  ${features ? `✨ ${features}` : ""}
`;
        });
      });

      // Add price range summary
      const minPrice = Math.min(...allProperties.filter(p => p.valor).map(p => p.valor));
      const maxPrice = Math.max(...allProperties.filter(p => p.valor).map(p => p.valor));
      propertyContext += `\n### RESUMO DO PORTFÓLIO
- Faixa de valores: R$ ${minPrice?.toLocaleString("pt-BR")} a R$ ${maxPrice?.toLocaleString("pt-BR")}
- Bairros disponíveis: ${Object.keys(byNeighborhood).join(", ")}
`;
    } else {
      propertyContext = "\n\n## NOTA: Portfólio em atualização. Informe que você vai verificar disponibilidade e retornar em breve.";
    }

    // Get approved AI learnings
    const { data: learnings } = await supabase
      .from("aprendizados_ia")
      .select("pergunta, resposta, tipo")
      .eq("status", "aprovado")
      .limit(15);

    let learningsContext = "";
    if (learnings && learnings.length > 0) {
      learningsContext = "\n\n## CONHECIMENTO APROVADO (Use para referência):\n";
      learnings.forEach((l) => {
        learningsContext += `[${l.tipo}] P: ${l.pergunta}\nR: ${l.resposta}\n\n`;
      });
    }

    // Add lead profile context if available
    let leadContext = "";
    if (Object.keys(previousInterests).length > 0) {
      leadContext = `\n\n## PERFIL DO LEAD (Acumulado):
- Bairros de interesse: ${previousInterests.bairros?.join(", ") || "Não definido"}
- Faixa de valor: ${previousInterests.valorMin ? `R$ ${previousInterests.valorMin.toLocaleString("pt-BR")}` : "?"} a ${previousInterests.valorMax ? `R$ ${previousInterests.valorMax.toLocaleString("pt-BR")}` : "?"}
- Configuração: ${previousInterests.quartos || "?"} quartos
- Tipo: ${previousInterests.tipo || "Não definido"}
- Momento: ${previousInterests.momentoVida || "Não identificado"}
- Estágio SPIN: ${previousInterests.estagioSpin || "Situação"}
- Urgência: ${previousInterests.urgencia || "Não definida"}
`;
    }

    // ==========================================================================
    // STEP 2: Chain-of-Thought Analysis (Internal Reasoning)
    // ==========================================================================

    console.log(`[ai-chat] Session ${sessionId}: Running Chain-of-Thought analysis...`);

    const cotResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: CHAIN_OF_THOUGHT_PROMPT },
          {
            role: "user",
            content: `Histórico completo da conversa:
${existingMessages.map((m, i) => `[${i + 1}] ${m.role}: ${m.content}`).join("\n")}

Última mensagem do cliente: ${message}

Interesses já identificados: ${JSON.stringify(previousInterests)}

Analise e extraia as informações estratégicas.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_lead",
              description: "Análise estratégica do lead imobiliário",
              parameters: {
                type: "object",
                properties: {
                  // Contact data
                  nomeCliente: { type: "string", description: "Nome completo do cliente (se mencionado na conversa)" },
                  emailCliente: { type: "string", description: "Email do cliente (se mencionado na conversa)" },
                  
                  // Property interests
                  bairros: { type: "array", items: { type: "string" }, description: "Bairros de interesse" },
                  valorMin: { type: "number", description: "Valor mínimo" },
                  valorMax: { type: "number", description: "Valor máximo" },
                  quartos: { type: "number", description: "Quartos desejados" },
                  suites: { type: "number", description: "Suítes desejadas" },
                  vagas: { type: "number", description: "Vagas desejadas" },
                  tipo: { type: "string", description: "Tipo (apartamento, cobertura, casa)" },
                  urgencia: { type: "string", enum: ["baixa", "media", "alta", "urgente"], description: "Urgência" },
                  caracteristicas: { type: "array", items: { type: "string" }, description: "Características especiais" },
                  
                  // Lead profile
                  momentoVida: { type: "string", description: "Momento de vida do cliente" },
                  tipoComprador: { type: "string", enum: ["morador", "investidor", "primeiro_imovel"], description: "Tipo de comprador" },
                  estagioSpin: { type: "string", enum: ["situacao", "problema", "implicacao", "necessidade"], description: "Estágio atual SPIN" },
                  prazoCompra: { type: "string", enum: ["imediato", "3_meses", "6_meses", "indefinido"], description: "Prazo de compra" },
                  qualificationScore: { type: "number", description: "Score 0-100" },
                  proximaAcao: { type: "string", description: "Próxima ação recomendada" },
                  
                  // Visit scheduling
                  querAgendarVisita: { type: "boolean", description: "Cliente quer agendar visita?" },
                  dataVisitaSugerida: { type: "string", description: "Data sugerida para visita (formato YYYY-MM-DD)" },
                  horarioVisitaSugerido: { type: "string", description: "Horário sugerido (formato HH:MM)" },
                  imovelVisita: { type: "string", description: "Código do imóvel para visita" },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_lead" } },
        temperature: 0.3,
      }),
    });

    let analysis: LeadAnalysis = {
      extractedInterests: previousInterests,
      qualificationScore: conversation.qualification_score || 0,
      spinStage: "situacao",
      nextAction: "descoberta",
    };

    if (cotResponse.ok) {
      const cotData = await cotResponse.json();
      const toolCall = cotData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const analyzed = JSON.parse(toolCall.function.arguments);
          analysis = {
            extractedInterests: {
              ...previousInterests,
              ...analyzed,
            },
            qualificationScore: analyzed.qualificationScore || analysis.qualificationScore,
            spinStage: analyzed.estagioSpin || "situacao",
            nextAction: analyzed.proximaAcao || "descoberta",
          };
          console.log(`[ai-chat] CoT Analysis: Score=${analysis.qualificationScore}, Stage=${analysis.spinStage}`);
        } catch (e) {
          console.error("[ai-chat] Error parsing CoT:", e);
        }
      }
    }

    // ==========================================================================
    // STEP 3: Generate Elite Consultant Response
    // ==========================================================================

    const fullSystemPrompt = SYSTEM_PROMPT + propertyContext + learningsContext + leadContext;

    const aiMessages: Message[] = [
      { role: "system", content: fullSystemPrompt },
      ...existingMessages,
      { role: "user", content: message },
    ];

    console.log(`[ai-chat] Generating response with ${existingMessages.length} messages of history...`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview", // Using Flash for faster, more concise responses
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 600, // Reduced for concise responses
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Estamos com alta demanda no momento. Por favor, aguarde alguns segundos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Sistema temporariamente indisponível. Nossa equipe foi notificada." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("[ai-chat] AI Gateway error:", aiResponse.status, errorText);
      throw new Error("AI Gateway error");
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 
      "Desculpe, tive um problema técnico. Pode repetir sua pergunta?";

    // ==========================================================================
    // STEP 4: Update conversation and lead scoring
    // ==========================================================================

    const updatedMessages = [
      ...existingMessages,
      { role: "user", content: message },
      { role: "assistant", content: assistantMessage },
    ].slice(-30); // Keep 30 messages for context

    const qualificationScore = analysis.qualificationScore;

    await supabase
      .from("ai_conversations")
      .update({
        messages: updatedMessages,
        extracted_interests: analysis.extractedInterests,
        qualification_score: qualificationScore,
        lead_qualified: qualificationScore >= 50,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // ==========================================================================
    // STEP 5: CRM Pipeline Integration
    // ==========================================================================

    const determineStage = (score: number): string => {
      if (score >= 85) return "visit"; // Muito quente -> Visita Agendada
      if (score >= 70) return "contact"; // Quente -> Em Contato
      if (score >= 50) return "contact"; // Morno -> Em Contato
      return "lead"; // Frio -> Novo Lead
    };

    const determinePriority = (score: number): string => {
      if (score >= 85) return "high";
      if (score >= 60) return "medium";
      return "low";
    };

    if (qualificationScore >= 30 && phone) {
      // Get master user for created_by (system user for AI-created clients)
      const { data: masterProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", "brunofp01@gmail.com")
        .single();
      
      const systemUserId = masterProfile?.user_id || null;
      
      if (!systemUserId) {
        console.error("[ai-chat] No master user found for AI-created clients");
      }
      
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id, name, stage, priority, notes, email")
        .eq("phone", phone)
        .single();

      const newStage = determineStage(qualificationScore);
      const newPriority = determinePriority(qualificationScore);
      const interests = analysis.extractedInterests;

      // Use extracted name or fallback
      const clientName = interests.nomeCliente || existingClient?.name || `Lead IA ${phone.slice(-4)}`;
      const clientEmail = interests.emailCliente || existingClient?.email || null;

      const clientNotes = `🤖 Lead qualificado por IA (Score: ${qualificationScore}/100)
📍 Bairros: ${interests.bairros?.join(", ") || "Não definido"}
💰 Budget: ${interests.valorMin ? `R$ ${interests.valorMin.toLocaleString("pt-BR")}` : "?"} - ${interests.valorMax ? `R$ ${interests.valorMax.toLocaleString("pt-BR")}` : "?"}
🏠 Tipo: ${interests.tipo || "?"} | ${interests.quartos || "?"} quartos
👤 Perfil: ${interests.tipoComprador || "Não identificado"}
⏰ Prazo: ${interests.prazoCompra || "Indefinido"}
📊 Estágio SPIN: ${interests.estagioSpin || "Situação"}`;

      let clientId: string | null = existingClient?.id || null;

      if (!existingClient && systemUserId) {
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            name: clientName,
            phone,
            email: clientEmail,
            stage: newStage,
            priority: newPriority,
            source: platform === "whatsapp" ? "WhatsApp IA" : "Chat Web IA",
            budget: interests.valorMax ? `Até R$ ${interests.valorMax.toLocaleString("pt-BR")}` : null,
            preferred_region: interests.bairros?.join(", ") || null,
            property_type: interests.tipo || null,
            notes: clientNotes,
            created_by: systemUserId,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[ai-chat] Error creating client:`, insertError);
        } else if (newClient) {
          clientId = newClient.id;
          await supabase
            .from("ai_conversations")
            .update({ client_id: newClient.id })
            .eq("id", conversation.id);
          console.log(`[ai-chat] Created client ${newClient.id}: ${clientName} - ${newStage}/${newPriority}`);
          
          // Send push notification to master user about new lead
          await supabase
            .from("notifications")
            .insert({
              user_id: systemUserId,
              title: "🤖 Novo Lead via IA",
              message: `${clientName} (${phone}) - Score: ${qualificationScore}/100. Interesse: ${interests.bairros?.join(", ") || "Não definido"}`,
              type: "ai_lead",
              related_id: newClient.id,
            });
          console.log(`[ai-chat] Notification sent for new lead ${clientName}`);
        }
      } else if (existingClient) {
        clientId = existingClient.id;
        
        // Update client with new extracted data
        const updateData: Record<string, unknown> = {
          stage: newStage,
          priority: newPriority,
          notes: clientNotes,
        };

        // Update name if we got a real name (not the default)
        if (interests.nomeCliente && existingClient.name.startsWith("Lead IA")) {
          updateData.name = interests.nomeCliente;
        }
        
        // Update email if newly extracted
        if (interests.emailCliente && !existingClient.email) {
          updateData.email = interests.emailCliente;
        }
        
        // Update budget and preferences
        if (interests.valorMax) {
          updateData.budget = `Até R$ ${interests.valorMax.toLocaleString("pt-BR")}`;
        }
        if (interests.bairros?.length) {
          updateData.preferred_region = interests.bairros.join(", ");
        }
        if (interests.tipo) {
          updateData.property_type = interests.tipo;
        }

        const shouldUpdate =
          (newStage !== existingClient.stage && qualificationScore > (conversation.qualification_score || 0)) ||
          (newPriority === "high" && existingClient.priority !== "high") ||
          interests.nomeCliente ||
          interests.emailCliente;

        if (shouldUpdate) {
          await supabase
            .from("clients")
            .update(updateData)
            .eq("id", existingClient.id);
          console.log(`[ai-chat] Updated client ${existingClient.id}: ${updateData.name || existingClient.name} - ${newStage}/${newPriority}`);
        }

        if (!conversation.client_id) {
          await supabase
            .from("ai_conversations")
            .update({ client_id: existingClient.id })
            .eq("id", conversation.id);
        }
      }

      // ==========================================================================
      // STEP 6: Automatic Visit Scheduling
      // ==========================================================================
      
      if (interests.querAgendarVisita && interests.dataVisitaSugerida && clientId) {
        console.log(`[ai-chat] Scheduling visit for client ${clientId}: ${interests.dataVisitaSugerida} ${interests.horarioVisitaSugerido || "10:00"}`);
        
        // Parse date and time
        const visitDate = interests.dataVisitaSugerida;
        const visitTime = interests.horarioVisitaSugerido || "10:00";
        const startDateTime = new Date(`${visitDate}T${visitTime}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour visit
        
        // Get property info if specified
        let visitTitle = "Visita agendada via IA";
        let visitLocation = "";
        
        if (interests.imovelVisita) {
          const { data: property } = await supabase
            .from("imoveis")
            .select("titulo, endereco, bairro, cidade")
            .eq("codigo", interests.imovelVisita)
            .single();
          
          if (property) {
            visitTitle = `Visita: ${property.titulo || interests.imovelVisita}`;
            visitLocation = property.endereco 
              ? `${property.endereco}, ${property.bairro || ""} - ${property.cidade || ""}`
              : property.bairro || "";
          }
        }
        
        // Create the appointment (only if we have a system user)
        if (systemUserId) {
          const { data: appointment, error: appointmentError } = await supabase
            .from("appointments")
            .insert({
              client_id: clientId,
              title: visitTitle,
              description: `Visita agendada automaticamente pela IA.\nCliente: ${clientName}\nTelefone: ${phone}\nPlataforma: ${platform}`,
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              type: "visit",
              location: visitLocation,
              created_by: systemUserId,
            })
            .select()
            .single();
          
          if (appointment) {
            console.log(`[ai-chat] Created appointment ${appointment.id} for client ${clientId}`);
            
            // Update client stage to "visit" since we scheduled a visit
            await supabase
              .from("clients")
              .update({ stage: "visit", priority: "high" })
              .eq("id", clientId);
            
            // Log the interaction
            await supabase
              .from("client_interactions")
              .insert({
                client_id: clientId,
                type: "visit",
                notes: `Visita agendada pela IA para ${visitDate} às ${visitTime}. ${visitLocation ? `Local: ${visitLocation}` : ""}`,
                created_by: systemUserId,
              });
            
            // Send push notification about scheduled visit
            await supabase
              .from("notifications")
              .insert({
                user_id: systemUserId,
                title: "📅 Visita Agendada via IA",
                message: `${clientName} - ${visitDate} às ${visitTime}. ${visitTitle}`,
                type: "ai_visit",
                related_id: appointment.id,
              });
              
            console.log(`[ai-chat] Visit scheduled successfully for ${visitDate} at ${visitTime}`);
          } else if (appointmentError) {
            console.error(`[ai-chat] Error creating appointment:`, appointmentError);
          }
        } else {
          console.error("[ai-chat] Cannot create appointment: no system user available");
        }
      }
    }

    // Log learning opportunities for objections and questions
    const isQuestion = message.includes("?");
    const isObjection = /não sei|vou pensar|caro|depois|talvez/i.test(message);

    if (isQuestion || isObjection) {
      await supabase.from("aprendizados_ia").insert({
        tipo: isObjection ? "objecao" : "pergunta_frequente",
        pergunta: message,
        resposta: assistantMessage,
        contexto: { 
          sessionId, 
          platform, 
          qualificationScore,
          spinStage: analysis.spinStage,
        },
      });
    }

    console.log(`[ai-chat] Session ${sessionId}: Response generated, score: ${qualificationScore}, stage: ${analysis.spinStage}`);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        extractedInterests: analysis.extractedInterests,
        qualificationScore,
        spinStage: analysis.spinStage,
        sessionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ai-chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
