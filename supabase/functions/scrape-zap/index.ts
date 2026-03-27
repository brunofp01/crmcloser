const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { estado, cidade, bairro, pagina = 1 } = await req.json();

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

    // Normalise inputs to URL-safe slugs
    const normalise = (s: string) =>
      s.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const estadoSlug  = normalise(estado);
    const cidadeSlug  = normalise(cidade);
    const bairroSlug  = normalise(bairro);

    // Pattern: /venda/imoveis/{estado}+{cidade}++{bairro}/
    const zapUrl = `https://www.zapimoveis.com.br/venda/imoveis/${estadoSlug}+${cidadeSlug}++${bairroSlug}/?pagina=${pagina}`;
    console.log('Scraping Zap URL:', zapUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: zapUrl,
        formats: ['markdown', 'extract'],
        onlyMainContent: false,
        waitFor: 15000,
        extract: {
          schema: {
            type: 'object',
            properties: {
              imoveis: {
                type: 'array',
                description: 'List of property listings shown on the search results page',
                items: {
                  type: 'object',
                  properties: {
                    title:       { type: 'string',  description: 'Property title/description headline shown on the card' },
                    price:       { type: 'number',  description: 'Asking price in BRL (number only, no currency symbols or formatting). E.g. 850000' },
                    area:        { type: 'number',  description: 'Total area in m²' },
                    bedrooms:    { type: 'number',  description: 'Number of bedrooms (quartos)' },
                    bathrooms:   { type: 'number',  description: 'Number of bathrooms (banheiros)' },
                    parking:     { type: 'number',  description: 'Number of parking spaces (vagas)' },
                    neighborhood:{ type: 'string',  description: 'Neighborhood (bairro)' },
                    city:        { type: 'string',  description: 'City (cidade)' },
                    state:       { type: 'string',  description: 'State abbreviation (UF), e.g. MG' },
                    address:     { type: 'string',  description: 'Street address shown on the card' },
                    url:         { type: 'string',  description: 'Full absolute URL of the individual property listing page on zapimoveis.com.br' },
                    image_url:   { type: 'string',  description: 'Full absolute URL of the main property photo' },
                    type:        { type: 'string',  description: 'Property type: apartamento, casa, cobertura, kitnet, studio, loft, terreno, sala comercial' },
                    suites:      { type: 'number',  description: 'Number of suites' },
                  },
                },
              },
              total_results: {
                type: 'number',
                description: 'Total number of listings found for this search, as shown on the page (e.g. "1.245 imóveis")',
              },
            },
          },
          prompt: `You are extracting real estate listing data from a Zap Imóveis SEARCH RESULTS page (not a single property detail page).
The page shows a grid/list of multiple property cards.

CRITICAL INSTRUCTIONS:
1. Extract ALL property listings visible as cards on the page. This is the search results page so it may show 10-20 listings at once.
2. For each listing card, extract: title, price, area (m²), bedrooms, bathrooms, parking spaces, neighborhood, city, state, the individual listing URL, the main photo URL, property type and suites.
3. Each listing card has its own link — extract the FULL absolute URL (starting with https://www.zapimoveis.com.br/).
4. Return prices as plain numbers without R$, dots or commas. E.g. R$ 1.250.000 → 1250000.
5. The "total_results" is the number shown at the top of the page like "X imóveis encontrados".
6. Do NOT include sponsored listings from other sites — only real Zap Imóveis listings.
7. If a field is not visible on a card, return null for that field.`,
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

    const jsonData  = scrapeData.data?.extract || scrapeData.data?.json || scrapeData.extract || scrapeData.json || {};
    const imoveis   = Array.isArray(jsonData.imoveis) ? jsonData.imoveis : [];
    const total     = jsonData.total_results ?? null;

    console.log(`Zap scrape OK: ${imoveis.length} listings, total=${total}`);

    // Map to a clean shape
    const listings = imoveis.map((item: any, idx: number) => ({
      id:           idx,
      titulo:       item.title        || null,
      valor:        item.price        || null,
      metragem:     item.area         || null,
      quartos:      item.bedrooms     || null,
      banheiros:    item.bathrooms    || null,
      vagas:        item.parking      || null,
      suites:       item.suites       || null,
      tipo:         item.type         || null,
      bairro:       item.neighborhood || null,
      cidade:       item.city         || null,
      estado:       item.state        || null,
      endereco:     item.address      || null,
      url:          item.url          || null,
      imagem_url:   item.image_url    || null,
    }));

    return new Response(
      JSON.stringify({ success: true, data: { listings, total, page: pagina, url: zapUrl } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-zap:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
