const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract property code from known URL patterns
function extractCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // QuintoAndar: /imovel/v2/895219352/...
    const quintoAndarMatch = parsed.pathname.match(/\/imovel\/(?:v\d+\/)?(\d+)/);
    if (quintoAndarMatch) return quintoAndarMatch[1];
    
    // Generic: last numeric segment in path
    const segments = parsed.pathname.split('/').filter(Boolean);
    for (const seg of segments.reverse()) {
      if (/^\d{4,}$/.test(seg)) return seg;
    }
    
    // Check query params for common code keys
    for (const key of ['id', 'codigo', 'code', 'ref']) {
      const val = parsed.searchParams.get(key);
      if (val) return val;
    }
  } catch {}
  return null;
}

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

    // Extract code from URL before scraping
    const codeFromUrl = extractCodeFromUrl(formattedUrl);
    console.log('Code extracted from URL:', codeFromUrl);

    console.log('Scraping listing URL:', formattedUrl);

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
              title: { type: 'string', description: 'The main headline/title of the property listing page - this is usually the largest text at the top of the page' },
              price: { type: 'number', description: 'The MAIN asking price shown prominently on the page in BRL (just the number, no currency symbol). Look for the largest/most prominent price on the page, ignore smaller prices from related listings.' },
              area: { type: 'number', description: 'Total area in square meters (m²) of the main property' },
              type: { type: 'string', description: 'Property type: apartamento, cobertura, casa, kitnet, loft, studio, terreno, sala comercial, loja, galpão' },
              bedrooms: { type: 'number', description: 'Number of bedrooms (quartos) of the main property' },
              suites: { type: 'number', description: 'Number of suites of the main property' },
              living_rooms: { type: 'number', description: 'Number of living rooms (salas)' },
              kitchens: { type: 'number', description: 'Number of kitchens (cozinhas)' },
              bathrooms: { type: 'number', description: 'Number of bathrooms (banheiros) of the main property' },
              parking: { type: 'number', description: 'Number of parking spaces (vagas) of the main property' },
              has_social_elevator: { type: 'boolean', description: 'Has social elevator' },
              has_service_elevator: { type: 'boolean', description: 'Has service elevator' },
              leisure_amenities: { type: 'array', items: { type: 'string' }, description: 'Leisure amenities (piscina, academia, salão de festas, etc.)' },
              neighborhood: { type: 'string', description: 'Neighborhood (bairro)' },
              city: { type: 'string', description: 'City (cidade)' },
              state: { type: 'string', description: 'State (estado) - use 2-letter abbreviation like MG, SP, RJ' },
              address: { type: 'string', description: 'Street name only (without number)' },
              building_number: { type: 'string', description: 'Building number' },
              apartment_number: { type: 'string', description: 'Apartment/unit number' },
              block: { type: 'string', description: 'Building block (bloco)' },
              description: { type: 'string', description: 'Property description text' },
              portaria: { type: 'string', description: 'Type of doorman/concierge service. Return one of: portaria_24h, portaria_diurna, portaria_noturna, portaria_virtual. Look for keywords like "portaria 24h", "portaria 24 horas", "portaria diurna", "portaria noturna", "portaria virtual", "portaria remota".' },
              image_url: { type: 'string', description: 'The main/hero property photo URL (full absolute URL starting with http). Look for the largest image in the gallery or og:image meta tag. This should be a direct image URL ending in .jpg, .png, .webp or from a CDN.' },
              property_code: { type: 'string', description: 'The unique property code/reference number (código do imóvel). This is usually displayed as "Código", "Ref", "ID", "Cód" on the listing page. It is a unique identifier for the property.' },
            },
          },
          prompt: `You are extracting data from a real estate listing page. The URL is: ${formattedUrl}

CRITICAL INSTRUCTIONS:
1. Extract ONLY the PRIMARY property being sold/rented on this page - the one that the URL directly points to.
2. IGNORE all "similar properties", "related listings", "you might also like", "other properties nearby" sections.
3. The MAIN PRICE is usually the most prominent/largest price displayed on the page, often near the top.
4. If there are multiple properties shown, the MAIN one is the one with the most detailed description, the most photos, and the prominent price.
5. Return price as a plain number without currency symbols or formatting (e.g., 1690000 not R$ 1.690.000).
6. For sites like QuintoAndar, Zap Imóveis, OLX, VivaReal - the main listing is always at the top with a large photo gallery.
7. For property_code: Look for labels like "Código", "Ref", "Referência", "ID do imóvel", "Cód" on the page. This is distinct from the URL path.`,
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

    console.log('Extracted data:', JSON.stringify(jsonData));

    // Determine the property code: URL extraction takes priority for QuintoAndar, otherwise use scraped value
    const codigo_imovel = codeFromUrl || jsonData.property_code || null;
    console.log('Final property code:', codigo_imovel);

    const result = {
      success: true,
      data: {
        title: jsonData.title || metadata.title || null,
        valor: jsonData.price || null,
        metragem: jsonData.area || null,
        tipo: jsonData.type || null,
        quartos: jsonData.bedrooms || null,
        suites: jsonData.suites || null,
        salas: jsonData.living_rooms || null,
        cozinhas: jsonData.kitchens || null,
        banheiros: jsonData.bathrooms || null,
        vagas: jsonData.parking || null,
        elevador_social: jsonData.has_social_elevator || false,
        elevador_servico: jsonData.has_service_elevator || false,
        area_lazer: jsonData.leisure_amenities || [],
        bairro: jsonData.neighborhood || null,
        cidade: jsonData.city || null,
        estado: jsonData.state || null,
        endereco: jsonData.address || null,
        numero_predio: jsonData.building_number || null,
        numero_apartamento: jsonData.apartment_number || null,
        bloco: jsonData.block || null,
        listing_description: jsonData.description || null,
        listing_image_url: jsonData.image_url || metadata.ogImage || metadata['og:image'] || null,
        portaria: jsonData.portaria || null,
        codigo_imovel,
      },
    };

    console.log('Scrape successful:', result.data.title);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping listing:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
