const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping lancamento URL:', formattedUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'extract', 'links'],
        onlyMainContent: false,
        waitFor: 12000,
        extract: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'The name of the real estate development/building project (empreendimento)' },
              developer: { type: 'string', description: 'The construction company / developer name (construtora/incorporadora)' },
              description: { type: 'string', description: 'Full description of the development project' },
              property_type: { type: 'string', description: 'Property type: apartamento, cobertura, casa, kitnet, loft, studio, terreno, sala comercial' },
              neighborhood: { type: 'string', description: 'Neighborhood (bairro)' },
              city: { type: 'string', description: 'City (cidade)' },
              state: { type: 'string', description: 'State (estado) - use 2-letter abbreviation like MG, SP, RJ' },
              address: { type: 'string', description: 'Street name and number' },
              zip_code: { type: 'string', description: 'CEP / Zip code' },
              delivery_date: { type: 'string', description: 'Expected delivery date (previsão de entrega). Format as "Mês/Ano" like "Dez/2026"' },
              price_min: { type: 'number', description: 'Minimum unit price in BRL (just the number). Look for "a partir de" or the lowest price shown.' },
              price_max: { type: 'number', description: 'Maximum unit price in BRL (just the number). Look for the highest price shown.' },
              area_min: { type: 'number', description: 'Minimum unit area in m²' },
              area_max: { type: 'number', description: 'Maximum unit area in m²' },
              bedrooms_min: { type: 'number', description: 'Minimum number of bedrooms' },
              bedrooms_max: { type: 'number', description: 'Maximum number of bedrooms' },
              suites_min: { type: 'number', description: 'Minimum number of suites' },
              suites_max: { type: 'number', description: 'Maximum number of suites' },
              parking_min: { type: 'number', description: 'Minimum number of parking spots' },
              parking_max: { type: 'number', description: 'Maximum number of parking spots' },
              floors: { type: 'number', description: 'Number of floors/stories in the building' },
              units_per_floor: { type: 'number', description: 'Number of units per floor' },
              total_units: { type: 'number', description: 'Total number of units in the development' },
              leisure_amenities: { type: 'array', items: { type: 'string' }, description: 'Leisure amenities: piscina, academia, salão de festas, playground, churrasqueira, sauna, spa, quadra, etc.' },
              differentials: { type: 'array', items: { type: 'string' }, description: 'Unique differentials/features of the development that are not leisure amenities (e.g. smart home, energy efficiency, pet place, coworking)' },
              hero_image_url: { type: 'string', description: 'The main/hero image URL of the development (full absolute URL starting with http). Look for the largest banner image, fachada, or og:image meta tag.' },
              logo_url: { type: 'string', description: 'The logo/brand image URL of the development or developer (full absolute URL starting with http).' },
              website_url: { type: 'string', description: 'Official website URL of the development if different from the scraped URL' },
              video_url: { type: 'string', description: 'Video tour URL (YouTube, Vimeo, etc.)' },
            },
          },
          prompt: `You are extracting data from a real estate DEVELOPMENT (empreendimento/lançamento) page. The URL is: ${formattedUrl}

CRITICAL INSTRUCTIONS:
1. This is a NEW CONSTRUCTION / DEVELOPMENT page, NOT a resale listing. Extract data about the entire project/building, not a single unit.
2. Developments typically have RANGES for specs (e.g., "2 a 4 quartos", "65m² a 120m²"). Extract both min and max values.
3. Developments typically have RANGES for prices (e.g., "a partir de R$ 500.000" or "de R$ 500.000 a R$ 1.200.000").
4. The name is the PROJECT name (e.g., "Residencial Solar", "Grand Park"), not just the address.
5. The developer/construtora is the company building the project (e.g., "MRV", "Cyrela", "Tenda").
6. For the hero image, prefer the building facade/rendering (perspectiva) over floor plans.
7. For leisure amenities, list each one separately (e.g., "Piscina adulto", "Piscina infantil", "Academia", "Salão de festas").
8. Return prices as plain numbers without currency symbols.
9. For differentials, extract unique features that distinguish this development (NOT leisure amenities).`,
        },
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jsonData = scrapeData.data?.extract || scrapeData.data?.json || scrapeData.extract || scrapeData.json || {};
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    console.log('Extracted lancamento data:', JSON.stringify(jsonData));

    const result = {
      success: true,
      data: {
        nome: jsonData.name || metadata.title || null,
        construtora: jsonData.developer || null,
        descricao: jsonData.description || null,
        tipo: jsonData.property_type || null,
        bairro: jsonData.neighborhood || null,
        cidade: jsonData.city || null,
        estado: jsonData.state || null,
        endereco: jsonData.address || null,
        cep: jsonData.zip_code || null,
        previsao_entrega: jsonData.delivery_date || null,
        valor_min: jsonData.price_min || null,
        valor_max: jsonData.price_max || null,
        area_min: jsonData.area_min || null,
        area_max: jsonData.area_max || null,
        quartos_min: jsonData.bedrooms_min || null,
        quartos_max: jsonData.bedrooms_max || null,
        suites_min: jsonData.suites_min || null,
        suites_max: jsonData.suites_max || null,
        vagas_min: jsonData.parking_min || null,
        vagas_max: jsonData.parking_max || null,
        andares: jsonData.floors || null,
        unidades_por_andar: jsonData.units_per_floor || null,
        total_unidades: jsonData.total_units || null,
        area_lazer: jsonData.leisure_amenities || [],
        diferenciais: jsonData.differentials || [],
        hero_image_url: jsonData.hero_image_url || metadata.ogImage || metadata['og:image'] || null,
        logo_url: jsonData.logo_url || null,
        website_url: jsonData.website_url || null,
        video_url: jsonData.video_url || null,
      },
    };

    console.log('Lancamento scrape successful:', result.data.nome);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping lancamento:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
