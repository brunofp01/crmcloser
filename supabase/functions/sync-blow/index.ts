import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const BLOW_BASE_URL = "https://www.blow.com.br";
const BLOW_LOGIN_URL = "https://www.blow.com.br/auth/jwt/login";
const HOTSITE_BASE_URL = "https://main.draodhn69q581.amplifyapp.com/hotsite/";
const MAX_PAGES_TO_SCRAPE = 10;
const MAX_PROPERTIES_TO_SCRAPE = 30; // Reduced to avoid timeout
const SCRAPE_DELAY_MS = 500;

// ============================================
// Types
// ============================================

interface BlowProperty {
  id: string;
  name: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  type?: string;
  status?: string;
  images?: string[];
  description?: string;
  amenities?: string[];
  developer?: string;
  url?: string;
  salesTable?: SalesTableEntry[];
  ownerInfo?: OwnerInfo;
  hotsiteId?: string;
}

interface SalesTableEntry {
  unit?: string;
  type?: string;
  area?: number;
  bedrooms?: number;
  price?: number;
  status?: string;
  floor?: string;
}

interface OwnerInfo {
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
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
}

interface FirecrawlSession {
  sessionId?: string;
  authenticated: boolean;
}

// ============================================
// Firecrawl Authentication with Actions
// ============================================

async function authenticateWithFirecrawl(
  firecrawlApiKey: string,
  email: string,
  password: string
): Promise<FirecrawlSession> {
  console.log("[sync-blow] Attempting Firecrawl authentication via form actions...");
  console.log(`[sync-blow] Login URL: ${BLOW_LOGIN_URL}`);
  
  try {
    // Use Firecrawl's actions feature to fill and submit the login form
    // Based on screenshot: Email input, Senha (password) input, ENTRAR button
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: BLOW_LOGIN_URL,
        formats: ['html'],
        waitFor: 8000,
        actions: [
          // Wait for React to render the login form
          { type: 'wait', milliseconds: 3000 },
          // Fill email field - using placeholder text selector
          { type: 'write', selector: 'input[placeholder="Email"], input[placeholder*="email" i], input[type="text"]:first-of-type', text: email },
          // Wait a bit
          { type: 'wait', milliseconds: 500 },
          // Fill password field - using placeholder text selector
          { type: 'write', selector: 'input[placeholder="Senha"], input[placeholder*="senha" i], input[type="password"]', text: password },
          // Wait a bit
          { type: 'wait', milliseconds: 500 },
          // Click ENTRAR button
          { type: 'click', selector: 'button:has-text("ENTRAR"), button:has-text("Entrar"), button[type="submit"]' },
          // Wait for redirect after login
          { type: 'wait', milliseconds: 6000 },
        ],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("[sync-blow] Firecrawl login action failed:", data);
      return { authenticated: false };
    }

    const html = data.data?.html || data.html || '';
    const finalUrl = data.data?.metadata?.sourceURL || data.metadata?.sourceURL || '';
    
    console.log(`[sync-blow] After login, final URL: ${finalUrl}`);
    
    // Check if we're now on the empreendimentos page (successful login)
    const isAuthenticated = finalUrl.includes('/empreendimentos') || 
                           html.includes('Sair') || 
                           html.includes('Logout') ||
                           html.includes('Minha conta') ||
                           !html.includes('Entrar');
    
    if (isAuthenticated) {
      console.log("[sync-blow] Authentication successful via Firecrawl actions!");
      return { 
        authenticated: true,
        sessionId: data.data?.sessionId || undefined
      };
    }
    
    console.log("[sync-blow] Authentication may have failed - still on login page or no session indicators");
    return { authenticated: false };
    
  } catch (error) {
    console.error("[sync-blow] Error during Firecrawl authentication:", error);
    return { authenticated: false };
  }
}

// ============================================
// Scraping Functions
// ============================================

async function scrapeListingPage(
  firecrawlApiKey: string,
  pageNum: number
): Promise<string[]> {
  const listUrl = `${BLOW_BASE_URL}/empreendimentos/?pagina=${pageNum}&regiao=belo%20horizonte&disponiveis=true`;
  console.log(`[sync-blow] Scraping listing page ${pageNum}: ${listUrl}`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: listUrl,
      formats: ['html', 'links'],
      waitFor: 8000,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`[sync-blow] Failed to scrape listing page ${pageNum}:`, data);
    return [];
  }

  const links = data.data?.links || data.links || [];
  const html = data.data?.html || data.html || '';
  
  const propertyUrls: string[] = [];
  const uuidPattern = /\/empreendimentos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i;
  
  // From links array
  for (const link of links) {
    const match = link.match(uuidPattern);
    if (match && !link.includes('/tabela-unidades')) {
      const fullUrl = link.startsWith('http') ? link : BLOW_BASE_URL + link;
      if (!propertyUrls.includes(fullUrl)) {
        propertyUrls.push(fullUrl);
      }
    }
  }
  
  // From HTML href attributes
  const hrefPattern = /href=["'](\/empreendimentos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/)?["']/gi;
  const hrefMatches = html.matchAll(hrefPattern);
  for (const match of hrefMatches) {
    const fullUrl = BLOW_BASE_URL + match[1];
    if (!propertyUrls.includes(fullUrl) && !fullUrl.includes('/tabela-unidades')) {
      propertyUrls.push(fullUrl);
    }
  }
  
  console.log(`[sync-blow] Page ${pageNum}: Found ${propertyUrls.length} property URLs`);
  return propertyUrls;
}

async function scrapePropertyPage(
  firecrawlApiKey: string,
  url: string
): Promise<{ markdown: string; html: string; metadata: Record<string, unknown> } | null> {
  console.log(`[sync-blow] Scraping property page: ${url}`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor: 6000,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`[sync-blow] Failed to scrape ${url}:`, data);
    return null;
  }

  return {
    markdown: data.data?.markdown || data.markdown || '',
    html: data.data?.html || data.html || '',
    metadata: data.data?.metadata || data.metadata || {},
  };
}

async function scrapeUnitsTablePage(
  firecrawlApiKey: string,
  propertyId: string
): Promise<SalesTableEntry[]> {
  const tableUrl = `${BLOW_BASE_URL}/empreendimentos/${propertyId}/tabela-unidades/`;
  console.log(`[sync-blow] Scraping units table: ${tableUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tableUrl,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 8000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`[sync-blow] Failed to scrape units table for ${propertyId}:`, data.error);
      return [];
    }

    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    
    return parseUnitsTable(html, markdown);
    
  } catch (error) {
    console.error(`[sync-blow] Error scraping units table for ${propertyId}:`, error);
    return [];
  }
}

// ============================================
// Parsing Functions
// ============================================

function extractPropertyId(url: string): string | null {
  const idMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return idMatch ? idMatch[1] : null;
}

function parsePropertyName(markdown: string, metadata: Record<string, unknown>): string {
  // Try from markdown heading
  const nameMatch = markdown.match(/^####\s+([^\n]+)/m);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  // Fallback to metadata title
  let name = (metadata.title as string) || '';
  if (name.includes('|')) {
    name = name.split('|')[0].trim();
  }
  return name;
}

function parseAddress(markdown: string): { neighborhood?: string; city?: string; state?: string } {
  const addressMatch = markdown.match(/^######\s+\*\*([^\n]+)\*\*/m);
  if (addressMatch) {
    const addressParts = addressMatch[1].split('|').map(s => s.trim());
    if (addressParts.length >= 2) {
      const locationPart = addressParts[1];
      const neighborhoodMatch = locationPart.match(/([^-]+)/);
      if (neighborhoodMatch) {
        return {
          neighborhood: neighborhoodMatch[1].trim(),
          city: 'Belo Horizonte',
          state: 'MG',
        };
      }
    }
  }
  return { city: 'Belo Horizonte', state: 'MG' };
}

function parseArea(markdown: string): { minArea?: number; maxArea?: number } {
  // Range format: "54,88 - 119,16 m²"
  const areaSummaryMatch = markdown.match(/(\d+[,.]?\d*)\s*-\s*(\d+[,.]?\d*)\s*m²/);
  if (areaSummaryMatch) {
    const minArea = parseFloat(areaSummaryMatch[1].replace(',', '.'));
    const maxArea = parseFloat(areaSummaryMatch[2].replace(',', '.'));
    return {
      minArea: !isNaN(minArea) ? minArea : undefined,
      maxArea: !isNaN(maxArea) ? maxArea : undefined,
    };
  }
  
  // Single value
  const singleAreaMatch = markdown.match(/(\d+[,.]?\d*)\s*m²/);
  if (singleAreaMatch) {
    const area = parseFloat(singleAreaMatch[1].replace(',', '.'));
    if (!isNaN(area) && area > 10 && area < 10000) {
      return { minArea: area, maxArea: area };
    }
  }
  
  return {};
}

function parseBedrooms(markdown: string): { minBedrooms?: number; maxBedrooms?: number } {
  // Range: "2 - 3 Quartos"
  const bedroomRangeMatch = markdown.match(/(\d+)\s*-\s*(\d+)\s*Quartos?/i);
  if (bedroomRangeMatch) {
    return {
      minBedrooms: parseInt(bedroomRangeMatch[1]),
      maxBedrooms: parseInt(bedroomRangeMatch[2]),
    };
  }
  
  // Single: "2 Quartos"
  const singleBedroomMatch = markdown.match(/(\d+)\s*Quartos?/i);
  if (singleBedroomMatch) {
    const qty = parseInt(singleBedroomMatch[1]);
    return { minBedrooms: qty, maxBedrooms: qty };
  }
  
  return {};
}

function parseStatus(markdown: string): string | undefined {
  const statusMatch = markdown.match(/\*\*Status:\*\*\s*([^\n]+)/i);
  return statusMatch ? statusMatch[1].trim() : undefined;
}

function parseDeveloper(markdown: string): string | undefined {
  const developerMatch = markdown.match(/\*\*(?:Construtora|Incorporadora\(?s?\)?):\*\*\s*([^\n]+)/i);
  return developerMatch ? developerMatch[1].trim() : undefined;
}

function parseDescription(markdown: string): string | undefined {
  const descMatch = markdown.match(/######[^\n]+\n+([^*]+?)(?:Ver mais|[\*]{3})/);
  return descMatch ? descMatch[1].trim().slice(0, 1000) : undefined;
}

function parseAmenities(markdown: string): string[] {
  const amenitiesMatch = markdown.match(/O que esse empreendimento oferece:\s*\n+([\s\S]+?)(?:\*\s*\*\s*\*|Mostrar Localização)/);
  if (!amenitiesMatch) return [];
  
  const amenitiesText = amenitiesMatch[1];
  const amenities: string[] = [];
  
  const lines = amenitiesText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.endsWith(':') && trimmed.length > 2 && trimmed.length < 100) {
      amenities.push(trimmed);
    }
  }
  
  return amenities.slice(0, 50);
}

function parsePropertyType(name: string, description?: string): string {
  const typeLower = (name + ' ' + (description || '')).toLowerCase();
  
  if (typeLower.includes('loteamento') || typeLower.includes('lote')) {
    return 'Loteamento';
  } else if (typeLower.includes('apartamento') || typeLower.includes('apt')) {
    return 'Apartamento';
  } else if (typeLower.includes('casa')) {
    return 'Casa';
  } else if (typeLower.includes('comercial') || typeLower.includes('sala')) {
    return 'Comercial';
  }
  return 'Empreendimento';
}

function parseImages(html: string): string[] {
  const imgPattern = /<img[^>]+src=["']([^"']+)["']/gi;
  const images: string[] = [];
  const imgMatches = html.matchAll(imgPattern);
  
  for (const match of imgMatches) {
    const src = match[1];
    if (src && 
        !src.includes('logo') && 
        !src.includes('icon') && 
        !src.includes('assets/') &&
        !src.includes('emoji') &&
        (src.includes('http') || src.startsWith('//'))) {
      const fullUrl = src.startsWith('//') ? 'https:' + src : src;
      if (!images.includes(fullUrl) && (fullUrl.includes('s3') || fullUrl.includes('amazonaws') || fullUrl.includes('cloudfront'))) {
        images.push(fullUrl);
      }
    }
  }
  
  return images.slice(0, 20);
}

function parseUnitsTable(html: string, markdown: string): SalesTableEntry[] {
  const salesTable: SalesTableEntry[] = [];
  
  // Try to find table rows with unit data
  const tableRowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rowMatches = html.matchAll(tableRowPattern);
  
  for (const rowMatch of rowMatches) {
    const rowHtml = rowMatch[1];
    const cells: string[] = [];
    
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cellMatches = rowHtml.matchAll(cellPattern);
    
    for (const cellMatch of cellMatches) {
      const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(cellText);
    }
    
    // Try to parse as sales row (needs at least price-like value)
    if (cells.length >= 3) {
      const priceCell = cells.find(c => c.includes('R$') || /\d{3}[\.,]\d{3}/.test(c));
      if (priceCell) {
        const priceMatch = priceCell.match(/[\d.,]+/g);
        const price = priceMatch ? parseFloat(priceMatch.join('').replace(/\./g, '').replace(',', '.')) : undefined;
        
        const areaCell = cells.find(c => c.includes('m²') || c.includes('m2'));
        const areaMatch = areaCell?.match(/(\d+[,.]?\d*)/);
        const area = areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : undefined;
        
        const bedroomCell = cells.find(c => /^\d+$/.test(c.trim()) || c.toLowerCase().includes('quarto'));
        const bedroomMatch = bedroomCell?.match(/(\d+)/);
        const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;
        
        const statusCell = cells.find(c => 
          c.toLowerCase().includes('disponível') || 
          c.toLowerCase().includes('vendido') ||
          c.toLowerCase().includes('reservado')
        );
        
        salesTable.push({
          unit: cells[0],
          type: cells.find(c => c.includes('Apartamento') || c.includes('Casa') || c.includes('Studio') || c.includes('Tipo')),
          area,
          bedrooms,
          price,
          status: statusCell,
          floor: cells.find(c => /^\d{1,2}º?$/.test(c.trim()) || c.toLowerCase().includes('andar')),
        });
      }
    }
  }
  
  // Also try markdown table format
  if (salesTable.length === 0) {
    const tableLines = markdown.split('\n').filter(line => line.includes('|') && line.trim().length > 5);
    
    for (const line of tableLines) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      
      if (cells.length >= 3) {
        const priceCell = cells.find(c => c.includes('R$') || /\d{3}[\.,]\d{3}/.test(c));
        if (priceCell) {
          const priceMatch = priceCell.match(/[\d.,]+/g);
          const price = priceMatch ? parseFloat(priceMatch.join('').replace(/\./g, '').replace(',', '.')) : undefined;
          
          const areaCell = cells.find(c => c.includes('m²'));
          const areaMatch = areaCell?.match(/(\d+[,.]?\d*)/);
          const area = areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : undefined;
          
          salesTable.push({
            unit: cells[0],
            area,
            price,
            status: cells.find(c => c.toLowerCase().includes('disponível') || c.toLowerCase().includes('vendido')),
          });
        }
      }
    }
  }
  
  console.log(`[sync-blow] Parsed ${salesTable.length} units from table`);
  return salesTable.slice(0, 200);
}

function parseOwnerInfo(html: string, markdown: string): OwnerInfo | undefined {
  const ownerInfo: OwnerInfo = {};
  
  // Look for developer/owner information
  const companyMatch = markdown.match(/(?:Construtora|Incorporadora|Desenvolvedor):\*\*\s*([^\n*]+)/i) ||
                       html.match(/(?:Construtora|Incorporadora|Desenvolvedor)[:\s]*([^<\n]+)/i);
  if (companyMatch) {
    ownerInfo.company = companyMatch[1].trim();
  }
  
  // Look for CNPJ
  const cnpjMatch = html.match(/CNPJ[:\s]*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2})/i);
  if (cnpjMatch) {
    ownerInfo.cnpj = cnpjMatch[1];
  }
  
  // Look for contact phone
  const phoneMatch = html.match(/(?:Telefone|Tel|Contato)[:\s]*\(?(\d{2})\)?[\s.-]*(\d{4,5})[\s.-]*(\d{4})/i);
  if (phoneMatch) {
    ownerInfo.phone = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
  }
  
  // Look for email
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    ownerInfo.email = emailMatch[0];
  }
  
  return Object.keys(ownerInfo).length > 0 ? ownerInfo : undefined;
}

function parseHotsiteId(html: string, url: string): string | undefined {
  // Try to extract hotsite ID from any hotsite links in the page
  const hotsitePatterns = [
    /hotsite\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    /data-hotsite-id=["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/i,
  ];
  
  for (const pattern of hotsitePatterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback: use the property ID from the URL
  return extractPropertyId(url) || undefined;
}

function parseBlowProperty(
  id: string,
  markdown: string,
  html: string,
  metadata: Record<string, unknown>,
  url: string
): BlowProperty | null {
  try {
    const name = parsePropertyName(markdown, metadata);
    
    if (!name || name.length < 3) {
      console.log(`[sync-blow] Skipping property ${id} - no valid name found`);
      return null;
    }

    const address = parseAddress(markdown);
    const area = parseArea(markdown);
    const bedrooms = parseBedrooms(markdown);
    const description = parseDescription(markdown);

    const property: BlowProperty = {
      id,
      name,
      url,
      ...address,
      ...area,
      ...bedrooms,
      status: parseStatus(markdown),
      developer: parseDeveloper(markdown),
      description,
      amenities: parseAmenities(markdown),
      type: parsePropertyType(name, description),
      images: parseImages(html),
      ownerInfo: parseOwnerInfo(html, markdown),
      hotsiteId: parseHotsiteId(html, url),
    };

    console.log(`[sync-blow] Parsed: ${property.name} | Bairro: ${property.neighborhood || 'N/A'} | Quartos: ${property.minBedrooms || 'N/A'} | Área: ${property.minArea || 'N/A'}m²`);

    return property;
  } catch (e) {
    console.error(`[sync-blow] Error parsing property ${id}:`, e);
    return null;
  }
}

// ============================================
// Database Operations
// ============================================

async function upsertProperty(
  supabase: any,
  property: BlowProperty,
  existingCodes: Set<string>
): Promise<{ inserted: boolean; error?: string }> {
  try {
    const codigo = `blow-${property.id}`;
    
    // Use the hotsiteId if available, otherwise use property id
    const hotsiteUrl = HOTSITE_BASE_URL + (property.hotsiteId || property.id);
    
    const imovelData = {
      codigo,
      slug: `blow-${property.id}-${property.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'empreendimento'}`,
      titulo: property.name,
      descricao: property.description,
      tipo: property.type || 'Empreendimento',
      categoria: 'Venda',
      valor: property.minPrice,
      quartos: property.minBedrooms,
      area_util: property.minArea,
      bairro: property.neighborhood,
      cidade: property.city || 'Belo Horizonte',
      estado: property.state || 'MG',
      fotos: property.images || [],
      caracteristicas: property.amenities || [],
      ativo: true,
      source: 'blow',
      hotsite_url: hotsiteUrl,
      synced_at: new Date().toISOString(),
      xml_data: {
        salesTable: property.salesTable,
        ownerInfo: property.ownerInfo,
        developer: property.developer,
        status: property.status,
        maxPrice: property.maxPrice,
        maxArea: property.maxArea,
        maxBedrooms: property.maxBedrooms,
        blowUrl: property.url,
        hotsiteId: property.hotsiteId,
      },
    };

    const { error } = await supabase
      .from("imoveis")
      .upsert(imovelData, { onConflict: "codigo" });

    if (error) {
      return { inserted: false, error: error.message };
    }

    return { inserted: !existingCodes.has(codigo) };
  } catch (e) {
    return { inserted: false, error: String(e) };
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  const blowEmail = Deno.env.get("BLOW_EMAIL");
  const blowPassword = Deno.env.get("BLOW_PASSWORD");
  
  if (!firecrawlApiKey) {
    console.error("[sync-blow] FIRECRAWL_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create initial sync log
  const syncLog: SyncLog = {
    sync_type: 'blow_scraping',
    status: 'started',
    started_at: new Date().toISOString(),
    total_items: 0,
    inserted: 0,
    updated: 0,
    deactivated: 0,
    errors_count: 0,
  };

  const { data: logEntry } = await supabase
    .from('sync_logs')
    .insert(syncLog)
    .select()
    .single();

  const logId = logEntry?.id;

  const updateLog = async (updates: Partial<SyncLog>) => {
    if (!logId) return;
    await supabase
      .from('sync_logs')
      .update({ 
        ...updates, 
        duration_ms: Date.now() - startTime, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', logId);
  };

  try {
    console.log("[sync-blow] Starting Blow sync");

    // Try to authenticate if credentials are provided
    let authSession: FirecrawlSession = { authenticated: false };
    if (blowEmail && blowPassword) {
      authSession = await authenticateWithFirecrawl(firecrawlApiKey, blowEmail, blowPassword);
      console.log(`[sync-blow] Authentication status: ${authSession.authenticated}`);
    } else {
      console.log("[sync-blow] No credentials provided, proceeding without authentication");
    }

    // Step 1: Collect all property URLs from listing pages
    console.log("[sync-blow] Collecting property URLs from listing pages...");
    const allPropertyUrls: string[] = [];
    
    for (let page = 1; page <= MAX_PAGES_TO_SCRAPE; page++) {
      const urls = await scrapeListingPage(firecrawlApiKey, page);
      
      for (const url of urls) {
        if (!allPropertyUrls.includes(url)) {
          allPropertyUrls.push(url);
        }
      }
      
      console.log(`[sync-blow] After page ${page}: ${allPropertyUrls.length} unique URLs`);
      
      if (urls.length === 0) {
        console.log("[sync-blow] No more properties found, stopping pagination");
        break;
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`[sync-blow] Total unique property URLs: ${allPropertyUrls.length}`);

    if (allPropertyUrls.length === 0) {
      await updateLog({
        status: 'partial',
        error_message: 'No property URLs found on Blow website',
      });
      return new Response(
        JSON.stringify({ success: true, message: "No properties found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Scrape each property page and its units table
    const properties: BlowProperty[] = [];
    const errors: string[] = [];
    const urlsToScrape = allPropertyUrls.slice(0, MAX_PROPERTIES_TO_SCRAPE);

    for (const url of urlsToScrape) {
      try {
        const propertyId = extractPropertyId(url);
        if (!propertyId) {
          console.log(`[sync-blow] Could not extract ID from ${url}`);
          continue;
        }

        // Scrape main property page
        const scraped = await scrapePropertyPage(firecrawlApiKey, url);
        if (!scraped) {
          errors.push(`${url}: Failed to scrape`);
          continue;
        }

        const property = parseBlowProperty(
          propertyId,
          scraped.markdown,
          scraped.html,
          scraped.metadata,
          url
        );
        
        if (property) {
          // Note: Units table scraping disabled for now - requires authentication
          // TODO: Enable when Firecrawl session-based authentication works
          // const salesTable = await scrapeUnitsTablePage(firecrawlApiKey, propertyId);
          // if (salesTable.length > 0) {
          //   property.salesTable = salesTable;
          //   const prices = salesTable.filter(u => u.price).map(u => u.price!);
          //   if (prices.length > 0) {
          //     property.minPrice = Math.min(...prices);
          //     property.maxPrice = Math.max(...prices);
          //   }
          // }
          
          properties.push(property);
        }

        await new Promise(r => setTimeout(r, SCRAPE_DELAY_MS));
        
      } catch (e) {
        console.error(`[sync-blow] Exception scraping ${url}:`, e);
        errors.push(`${url}: ${e}`);
      }
    }

    console.log(`[sync-blow] Parsed ${properties.length} properties`);

    // Step 3: Upsert properties to database
    const { data: existingProperties } = await supabase
      .from("imoveis")
      .select("codigo")
      .eq("source", "blow");

    const existingCodes = new Set(existingProperties?.map(p => p.codigo) || []);
    const newCodes = new Set<string>();
    
    let inserted = 0;
    let updated = 0;

    for (const property of properties) {
      const result = await upsertProperty(supabase, property, existingCodes);
      
      if (result.error) {
        errors.push(`${property.id}: ${result.error}`);
      } else if (result.inserted) {
        inserted++;
      } else {
        updated++;
      }
      
      newCodes.add(`blow-${property.id}`);
    }

    // Step 4: Deactivate removed properties
    let deactivated = 0;
    for (const existingCode of existingCodes) {
      if (!newCodes.has(existingCode)) {
        const { error } = await supabase
          .from("imoveis")
          .update({ ativo: false })
          .eq("codigo", existingCode);

        if (!error) {
          deactivated++;
          console.log(`[sync-blow] Deactivated: ${existingCode}`);
        }
      }
    }

    // Update property_sources
    await supabase
      .from("property_sources")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("name", "blow");

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      authenticated: authSession.authenticated,
      stats: {
        urlsFound: allPropertyUrls.length,
        scraped: properties.length,
        inserted,
        updated,
        deactivated,
        errors: errors.length,
        propertiesWithPrices: properties.filter(p => p.salesTable && p.salesTable.length > 0).length,
      },
      errors: errors.slice(0, 10),
    };

    console.log("[sync-blow] Sync completed:", result.stats);

    await updateLog({
      status: errors.length > 0 ? 'partial' : 'success',
      total_items: properties.length,
      inserted,
      updated,
      deactivated,
      errors_count: errors.length,
      error_details: errors.length > 0 ? { errors: errors.slice(0, 20), authenticated: authSession.authenticated } : undefined,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[sync-blow] Error:", error);
    
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
