const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STATE_MAP: Record<string, string> = {
  'ac': 'acre', 'al': 'alagoas', 'ap': 'amapa', 'am': 'amazonas', 'ba': 'bahia',
  'ce': 'ceara', 'df': 'distrito-federal', 'es': 'espirito-santo', 'go': 'goias',
  'ma': 'maranhao', 'mt': 'mato-grosso', 'ms': 'mato-grosso-do-sul', 'mg': 'minas-gerais',
  'pa': 'para', 'pb': 'paraiba', 'pr': 'parana', 'pe': 'pernambuco', 'pi': 'piaui',
  'rj': 'rio-de-janeiro', 'rn': 'rio-grande-do-norte', 'rs': 'rio-grande-do-sul',
  'ro': 'rondonia', 'rr': 'roraima', 'sc': 'santa-catarina', 'sp': 'sao-paulo',
  'se': 'sergipe', 'to': 'tocantins'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      estado, cidade, bairro, regiao = '', pagina = 1, provider = 'zap',
      quartos = '', vagas = '', area = '', valor_max = ''
    } = await req.json();

    if (!estado || !cidade || !bairro) {
      return new Response(
        JSON.stringify({ success: false, error: 'estado, cidade e bairro são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalise = (s: string) =>
      s.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const eSlug = normalise(estado);
    const cSlug = normalise(cidade);
    const bSlug = normalise(bairro);
    const rSlug = normalise(regiao);

    let targetUrl = '';
    let providerPrompt = '';

    if (provider === 'netimoveis') {
      const fullState = STATE_MAP[eSlug] || eSlug;
      const stateUpper = eSlug.toUpperCase();
      
      if (rSlug) {
        targetUrl = `https://www.netimoveis.com/venda/${fullState}/${cSlug}/${rSlug}/${bSlug}?transacao=venda&localizacao=BR-${stateUpper}-${cSlug}-${bSlug}-${rSlug}-&pagina=${pagina}`;
      } else {
        targetUrl = `https://www.netimoveis.com/venda/${fullState}/${cSlug}/${bSlug}?pagina=${pagina}`;
      }
      providerPrompt = `Extract from Netimóveis. Criteria: ${quartos ? quartos + ' bedrooms min,' : ''} ${vagas ? vagas + ' parking min,' : ''} ${area ? area + ' area min,' : ''} ${valor_max ? 'price max ' + valor_max : ''}.`;

    } else if (provider === 'olx') {
      targetUrl = `https://www.olx.com.br/imoveis/venda/estado-${eSlug}/${cSlug}/${bSlug}?o=${pagina}`;
      providerPrompt = `Extract from OLX. Matching: ${quartos ? 'min ' + quartos + ' bedrooms,' : ''} ${valor_max ? 'max price ' + valor_max : ''}.`;

    } else {
      // Zap
      targetUrl = `https://www.zapimoveis.com.br/venda/imoveis/${eSlug}+${cSlug}++${bSlug}/?pagina=${pagina}`;
      providerPrompt = `Extract from Zap Imóveis. Criteria: ${quartos ? quartos + ' bedrooms,' : ''} ${vagas ? vagas + ' parking,' : ''} ${valor_max ? 'max price ' + valor_max : ''}.`;
    }

    console.log(`Scraping ${provider} URL (Optimized):`, targetUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['extract'],
        onlyMainContent: false,
        waitFor: 10000,
        timeout: 120000,
        // Increased scrolls to load more cards before extraction
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down', amount: 800 },
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 1200 },
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 1500 },
          { type: 'wait', milliseconds: 3000 },
        ],
        extract: {
          schema: {
            type: 'object',
            properties: {
              imoveis: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title:        { type: 'string' },
                    price:        { type: 'number' },
                    area:         { type: 'number' },
                    bedrooms:     { type: 'number' },
                    bathrooms:    { type: 'number' },
                    parking:      { type: 'number' },
                    neighborhood: { type: 'string' },
                    city:         { type: 'string' },
                    state:        { type: 'string' },
                    address:      { type: 'string' },
                    url:          { type: 'string' },
                    image_url:    { type: 'string' },
                    type:         { type: 'string' },
                    suites:       { type: 'number' },
                  },
                },
              },
              total_results: { type: 'number' },
            },
          },
          prompt: `IMPORTANT: EXTRACT ALL PROPERTY LISTINGS (AT LEAST 20-40 IF THEY EXIST). 
          ${providerPrompt} 
          Do not stop until every single card on the page has been processed. 
          Return title, price, area, rooms, parking, location, url, and image_url for each.`,
        },
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', JSON.stringify(scrapeData));
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Falha ao fazer scraping' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jsonData = scrapeData.data?.extract || scrapeData.data?.json || {};
    const imoveis  = Array.isArray(jsonData.imoveis) ? jsonData.imoveis : [];
    const total    = jsonData.total_results ?? null;

    const listings = imoveis.map((item: any, idx: number) => ({
      id:         idx,
      titulo:     item.title        || null,
      valor:      item.price        || null,
      metragem:   item.area         || null,
      quartos:    item.bedrooms     || null,
      banheiros:  item.bathrooms    || null,
      vagas:      item.parking      || null,
      suites:     item.suites       || null,
      tipo:       item.type         || null,
      bairro:     item.neighborhood || null,
      cidade:     item.city         || null,
      estado:     item.state        || null,
      endereco:   item.address      || null,
      url:        item.url          || null,
      imagem_url: item.image_url    || null,
    }));

    return new Response(
      JSON.stringify({ success: true, data: { listings, total, page: pagina, url: targetUrl, provider } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-listing:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
