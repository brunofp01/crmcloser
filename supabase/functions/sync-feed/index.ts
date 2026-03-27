import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XML_FEED_URL = "https://www.privusimoveis.com.br/integracao/vrsync";

interface PropertyData {
  codigo: string;
  slug: string;
  titulo?: string;
  descricao?: string;
  tipo?: string;
  categoria?: string;
  valor?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  area_util?: number;
  area_total?: number;
  bairro?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  fotos?: string[];
  caracteristicas?: string[];
  ativo?: boolean;
  destaque?: boolean;
  xml_data?: Record<string, unknown>;
}

interface SyncLog {
  id?: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  total_items: number;
  inserted: number;
  updated: number;
  deactivated: number;
  errors_count: number;
  error_message?: string;
  error_details?: Record<string, unknown>;
  feed_hash?: string;
  xml_size?: number;
}

// Gerar hash simples do conteúdo para detectar mudanças
function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Simple XML parser for VRSync property data
function parseXML(xmlText: string): PropertyData[] {
  const properties: PropertyData[] = [];
  
  // VRSync format can use different tag names: Listing, Ad, or Imovel
  const listingRegex = /<Listing\b[^>]*>([\s\S]*?)<\/Listing>|<Ad\b[^>]*>([\s\S]*?)<\/Ad>|<Imovel\b[^>]*>([\s\S]*?)<\/Imovel>/gi;
  let match;

  console.log("[sync-feed] XML sample (500-1500):", xmlText.slice(500, 1500));
  console.log("[sync-feed] Searching for Listing, Ad, or Imovel elements...");

  while ((match = listingRegex.exec(xmlText)) !== null) {
    const adXml = match[1] || match[2] || match[3];
    
    const getValue = (tags: string[]): string | undefined => {
      for (const tag of tags) {
        const regex = new RegExp(
          `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|` +
          `<${tag}[^>]*>([^<]*)<\\/${tag}>|` +
          `<${tag}[^>]*>\\s*<Value>([^<]*)<\\/Value>`, 
          'i'
        );
        const match = adXml.match(regex);
        const value = match ? (match[1] || match[2] || match[3])?.trim() : undefined;
        if (value) return value;
      }
      return undefined;
    };

    const getNumericValue = (tags: string[]): number | undefined => {
      const value = getValue(tags);
      if (!value) return undefined;
      const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(num) ? undefined : num;
    };

    const codigo = getValue(['ListingID', 'CodigoImovel', 'Codigo']) || '';
    if (!codigo) continue;

    const titulo = getValue(['Title', 'TituloImovel', 'Titulo']) || '';
    
    const listingUrl = getValue(['ListingURL', 'DetailViewUrl', 'VirtualTourLink', 'URLImovel', 'Link']);
    let slug = codigo;
    
    if (listingUrl && listingUrl.includes('/imovel/')) {
      const slugMatch = listingUrl.match(/\/imovel\/([^?#]+)/);
      if (slugMatch && slugMatch[1]) {
        slug = slugMatch[1];
      }
    } else if (titulo) {
      slug = `${codigo}-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 100)}`;
    }

    // Parse photos - VRSync format uses <Media><Item medium="image"><URL>...</URL></Item></Media>
    const fotos: string[] = [];
    
    // Debug: Log Media section for first property
    if (properties.length === 0) {
      const mediaSection = adXml.match(/<Media[^>]*>([\s\S]*?)<\/Media>/i);
      console.log("[sync-feed] First property Media section sample:", mediaSection ? mediaSection[0].slice(0, 1000) : "No Media found");
    }
    
    // VRSync format: <Media><Item medium="image">https://...jpg</Item></Media>
    const mediaItemRegex = /<Item[^>]*medium=["']?image["']?[^>]*>([\s\S]*?)<\/Item>/gi;
    let mediaMatch;
    while ((mediaMatch = mediaItemRegex.exec(adXml)) !== null) {
      const itemContent = mediaMatch[1];
      // Some feeds put the URL directly as the Item text; others nest it in <URL>
      const urlMatch = itemContent.match(/<URL[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+)(?:\]\]>)?<\/URL>/i);
      const directTextUrl = itemContent.replace(/<[^>]+>/g, '').trim();

      const candidate = (urlMatch?.[1] || (directTextUrl.startsWith('http') ? directTextUrl : ''))?.trim();
      if (candidate && !fotos.includes(candidate)) {
        fotos.push(candidate);
      }
    }
    
    // Fallback: direct URL patterns for any URL within Media block
    if (fotos.length === 0) {
      const mediaSection = adXml.match(/<Media[^>]*>([\s\S]*?)<\/Media>/i);
      if (mediaSection) {
        const allUrlsRegex = /<URL[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+)(?:\]\]>)?<\/URL>/gi;
        let urlMatch;
        while ((urlMatch = allUrlsRegex.exec(mediaSection[1])) !== null) {
          if (urlMatch[1] && !fotos.includes(urlMatch[1].trim())) {
            fotos.push(urlMatch[1].trim());
          }
        }
      }
    }
    
    // Another fallback: URLs ending with image extensions
    if (fotos.length === 0) {
      const directUrlRegex = /<URL[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+\.(?:jpg|jpeg|png|gif|webp)[^\]<\s]*)(?:\]\]>)?<\/URL>/gi;
      let fotoMatch;
      while ((fotoMatch = directUrlRegex.exec(adXml)) !== null) {
        if (fotoMatch[1] && !fotos.includes(fotoMatch[1].trim())) {
          fotos.push(fotoMatch[1].trim());
        }
      }
    }
    
    // Final fallback for Foto/Image tags
    if (fotos.length === 0) {
      const altUrlRegex = /<(?:Foto|Image|URLArquivo)[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+)(?:\]\]>)?<\/(?:Foto|Image|URLArquivo)>/gi;
      let fotoMatch;
      while ((fotoMatch = altUrlRegex.exec(adXml)) !== null) {
        if (fotoMatch[1] && !fotos.includes(fotoMatch[1].trim())) {
          fotos.push(fotoMatch[1].trim());
        }
      }
    }
    
    console.log(`[sync-feed] Property ${codigo}: Found ${fotos.length} photos`);

    // Parse features
    const caracteristicas: string[] = [];
    const featureRegex = /<(?:Feature|Caracteristica|Comodidade)[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/(?:Feature|Caracteristica|Comodidade)>/gi;
    let featureMatch;
    while ((featureMatch = featureRegex.exec(adXml)) !== null) {
      if (featureMatch[1]) {
        caracteristicas.push(featureMatch[1].trim());
      }
    }

    // Determine property type
    let tipo = getValue(['PropertyType', 'TipoImovel', 'Tipo']) || '';
    let categoria = getValue(['Category', 'Categoria', 'ListingType', 'TipoNegocio']) || '';
    
    // Determine status - check multiple possible fields
    const statusValue = getValue(['Status', 'StatusImovel', 'ListingStatus', 'Situacao'])?.toLowerCase() || '';
    const transactionType = getValue(['TransactionType', 'TipoTransacao'])?.toLowerCase() || '';
    
    // Lista de valores aceitos como ATIVO
    const activeValues = [
      'ativo', 'active', 'true', '1', 'yes', 'sim',
      'publicado', 'published',
      'for sale', 'for rent', 'venda', 'aluguel', 'locação', 'a venda', 'para venda', 'para alugar'
    ];
    
    // Verifica se o imóvel está ativo
    // Se não há status explícito, considera INATIVO (conforme regra definida)
    let isActive = false;
    
    if (statusValue) {
      isActive = activeValues.some(v => statusValue.includes(v));
    } else if (transactionType) {
      // Se não tem status mas tem tipo de transação, considera ativo
      isActive = activeValues.some(v => transactionType.includes(v));
    }
    // Se não há nenhum campo de status, isActive permanece false (ausência => inativo)
    
    console.log(`[sync-feed] Property ${codigo}: status="${statusValue}", transaction="${transactionType}", isActive=${isActive}`);
    
    // SKIP imóveis inativos - não devem entrar na base
    if (!isActive) {
      console.log(`[sync-feed] Skipping inactive property: ${codigo}`);
      continue;
    }
    
    if (!tipo && titulo) {
      const tituloLower = titulo.toLowerCase();
      if (tituloLower.includes('apartamento')) tipo = 'Apartamento';
      else if (tituloLower.includes('casa')) tipo = 'Casa';
      else if (tituloLower.includes('sala') || tituloLower.includes('comercial')) tipo = 'Comercial';
      else if (tituloLower.includes('terreno') || tituloLower.includes('lote')) tipo = 'Terreno';
      else if (tituloLower.includes('cobertura')) tipo = 'Cobertura';
      else tipo = 'Imóvel';
    }

    if (!categoria && titulo) {
      const tituloLower = titulo.toLowerCase();
      if (tituloLower.includes('venda') || tituloLower.includes('-venda')) categoria = 'Venda';
      else if (tituloLower.includes('aluguel') || tituloLower.includes('locação')) categoria = 'Aluguel';
      else categoria = 'Venda';
    }

    const property: PropertyData = {
      codigo,
      slug,
      titulo,
      descricao: getValue(['Description', 'Descricao', 'Observacao']),
      tipo,
      categoria,
      valor: getNumericValue(['Price', 'Valor', 'PrecoVenda', 'PrecoLocacao', 'ListPrice']),
      quartos: getNumericValue(['Bedrooms', 'Quartos', 'QtdDormitorios']),
      suites: getNumericValue(['Suites', 'QtdSuites']),
      banheiros: getNumericValue(['Bathrooms', 'Banheiros', 'QtdBanheiros']),
      vagas: getNumericValue(['Garage', 'Vagas', 'QtdVagas', 'ParkingSpaces']),
      area_util: getNumericValue(['LivingArea', 'AreaUtil', 'AreaPrivativa']),
      area_total: getNumericValue(['LotArea', 'AreaTotal', 'AreaConstruida']),
      bairro: getValue(['Neighborhood', 'Bairro']),
      cidade: getValue(['City', 'Cidade']),
      estado: getValue(['State', 'Estado', 'UF']),
      endereco: getValue(['Address', 'Endereco', 'Logradouro']),
      cep: getValue(['PostalCode', 'CEP']),
      latitude: getNumericValue(['Latitude']),
      longitude: getNumericValue(['Longitude']),
      fotos,
      caracteristicas,
      ativo: true,
      destaque: getValue(['Featured', 'Destaque'])?.toLowerCase() === 'true',
    };

    properties.push(property);
  }

  return properties;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Criar log inicial
  const syncLog: SyncLog = {
    sync_type: 'feed_xml',
    status: 'started',
    started_at: new Date().toISOString(),
    total_items: 0,
    inserted: 0,
    updated: 0,
    deactivated: 0,
    errors_count: 0,
  };

  const { data: logEntry, error: logError } = await supabase
    .from('sync_logs')
    .insert(syncLog)
    .select()
    .single();

  if (logError) {
    console.error("[sync-feed] Failed to create sync log:", logError);
  }

  const logId = logEntry?.id;

  // Função para atualizar o log
  const updateLog = async (updates: Partial<SyncLog>) => {
    if (!logId) return;
    
    const duration_ms = Date.now() - startTime;
    await supabase
      .from('sync_logs')
      .update({ ...updates, duration_ms, completed_at: new Date().toISOString() })
      .eq('id', logId);
  };

  try {
    console.log("[sync-feed] Starting sync from:", XML_FEED_URL);

    // Fetch XML with timeout and retry
    let feedResponse: Response | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !feedResponse?.ok) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        feedResponse = await fetch(XML_FEED_URL, {
          headers: {
            'Accept': 'application/xml, text/xml, */*',
            'User-Agent': 'Privus-CRM-Sync/1.0',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!feedResponse.ok) {
          console.error(`[sync-feed] Attempt ${retryCount + 1}: HTTP ${feedResponse.status}`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * retryCount)); // Exponential backoff
          }
        }
      } catch (fetchError) {
        console.error(`[sync-feed] Attempt ${retryCount + 1} failed:`, fetchError);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * retryCount));
        }
      }
    }

    if (!feedResponse?.ok) {
      const errorMsg = `Failed to fetch feed after ${maxRetries} attempts`;
      console.error("[sync-feed]", errorMsg);
      
      await updateLog({
        status: 'failed',
        error_message: errorMsg,
        error_details: { status: feedResponse?.status, retries: retryCount },
      });

      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await feedResponse.text();
    const xmlSize = xmlText.length;
    const feedHash = generateHash(xmlText);
    
    console.log("[sync-feed] Received XML, length:", xmlSize, "hash:", feedHash);

    // Verificar se o feed mudou desde a última sincronização
    const { data: lastSync } = await supabase
      .from('sync_logs')
      .select('feed_hash')
      .eq('status', 'success')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (lastSync?.feed_hash === feedHash) {
      console.log("[sync-feed] Feed unchanged since last sync, skipping");
      
      await updateLog({
        status: 'success',
        feed_hash: feedHash,
        xml_size: xmlSize,
        error_message: 'Feed unchanged since last sync - skipped',
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Feed unchanged since last sync",
          skipped: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse properties from XML
    const properties = parseXML(xmlText);
    console.log("[sync-feed] Parsed", properties.length, "properties");

    if (properties.length === 0) {
      console.log("[sync-feed] No properties found in XML");
      
      await updateLog({
        status: 'partial',
        feed_hash: feedHash,
        xml_size: xmlSize,
        error_message: 'No properties found in feed XML',
        error_details: { xmlPreview: xmlText.slice(0, 1000) },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No properties found in feed",
          xmlPreview: xmlText.slice(0, 500)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing property codes
    const { data: existingProperties } = await supabase
      .from("imoveis")
      .select("codigo");

    const existingCodes = new Set(existingProperties?.map(p => p.codigo) || []);
    const feedCodes = new Set(properties.map(p => p.codigo));

    let inserted = 0;
    let updated = 0;
    let deactivated = 0;
    const errors: string[] = [];

    // Upsert properties in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      for (const property of batch) {
        try {
          const { error } = await supabase
            .from("imoveis")
            .upsert(
              {
                ...property,
                synced_at: new Date().toISOString(),
              },
              { onConflict: "codigo" }
            );

          if (error) {
            console.error("[sync-feed] Error upserting", property.codigo, error);
            errors.push(`${property.codigo}: ${error.message}`);
          } else {
            if (existingCodes.has(property.codigo)) {
              updated++;
            } else {
              inserted++;
            }
          }
        } catch (e) {
          console.error("[sync-feed] Exception upserting", property.codigo, e);
          errors.push(`${property.codigo}: ${e}`);
        }
      }
    }

    // DELETE properties not in feed (user chose to delete, not just deactivate)
    for (const existingCode of existingCodes) {
      if (!feedCodes.has(existingCode)) {
        const { error } = await supabase
          .from("imoveis")
          .delete()
          .eq("codigo", existingCode);

        if (!error) {
          deactivated++;
          console.log(`[sync-feed] Deleted property not in feed: ${existingCode}`);
        } else {
          console.error(`[sync-feed] Failed to delete property ${existingCode}:`, error);
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        total: properties.length,
        inserted,
        updated,
        deactivated,
        errors: errors.length,
      },
      errors: errors.slice(0, 10),
    };

    console.log("[sync-feed] Sync completed:", result.stats);

    // Atualizar log com sucesso
    await updateLog({
      status: errors.length > 0 ? 'partial' : 'success',
      total_items: properties.length,
      inserted,
      updated,
      deactivated,
      errors_count: errors.length,
      feed_hash: feedHash,
      xml_size: xmlSize,
      error_details: errors.length > 0 ? { errors: errors.slice(0, 20) } : undefined,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[sync-feed] Error:", error);
    
    await updateLog({
      status: 'failed',
      error_message: errorMessage,
      error_details: { stack: error instanceof Error ? error.stack : undefined },
    });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
