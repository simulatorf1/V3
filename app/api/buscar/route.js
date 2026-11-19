// Ruta API que consulta Yahoo Finance y devuelve los resultados al buscador

// Mapa de bolsas: código interno → exchange code de Yahoo
const BOLSAS_YAHOO = {
  mc: ['MCE', 'MAD'],           // Madrid
  de: ['GER', 'FRA'],           // Frankfurt
  pa: ['PAR'],                  // París
  l: ['LSE', 'LON'],            // Londres
  as: ['AMS'],                  // Ámsterdam
  mi: ['MIL'],                  // Milán
  sw: ['EBS', 'SWX'],           // Suiza
  st: ['STO'],                  // Estocolmo
  ol: ['OSL'],                  // Oslo
  co: ['CPH'],                  // Copenhague
  he: ['HEL'],                  // Helsinki
  ls: ['LIS'],                  // Lisboa
  br: ['BRU'],                  // Bruselas
  vi: ['VIE'],                  // Viena
  ir: ['ISE', 'DUB'],           // Dublín
  ax: ['ASX'],                  // Australia
  hk: ['HKG'],                  // Hong Kong
  t: ['JPX', 'TYO'],            // Tokio
  us: ['NYQ', 'NMS', 'NGM', 'NYS', 'ASE', 'PCX', 'BATS'] // EE.UU.
};

// Mapa de sufijos de ticker: código interno → sufijo
const SUFIJOS_TICKER = {
  mc: '.MC',
  de: '.DE',
  pa: '.PA',
  l: '.L',
  as: '.AS',
  mi: '.MI',
  sw: '.SW',
  st: '.ST',
  ol: '.OL',
  co: '.CO',
  he: '.HE',
  ls: '.LS',
  br: '.BR',
  vi: '.VI',
  ir: '.IR',
  ax: '.AX',
  hk: '.HK',
  t: '.T',
  us: '' // Sin sufijo
};

function coincideBolsa(quote, bolsa) {
  if (!bolsa || bolsa === 'us') {
    // Para EE.UU., aceptar solo tickers sin punto (sin sufijo de bolsa)
    const symbol = quote.symbol || '';
    return !symbol.includes('.');
  }

  const sufijo = SUFIJOS_TICKER[bolsa];
  if (sufijo) {
    const symbol = (quote.symbol || '').toUpperCase();
    if (symbol.endsWith(sufijo.toUpperCase())) return true;
  }

  // Fallback: comprobar el exchange code de Yahoo
  const exchanges = BOLSAS_YAHOO[bolsa] || [];
  const exchange = (quote.exchange || '').toUpperCase();
  return exchanges.includes(exchange);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const bolsa = searchParams.get('bolsa') || 'mc'; // Madrid por defecto

  if (!q || q.trim().length < 2) {
    return Response.json({ resultados: [] });
  }

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=30&newsCount=0`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; V3/1.0)'
      }
    });

    if (!res.ok) {
      return Response.json({ resultados: [] });
    }

    const json = await res.json();
    const quotes = json?.quotes || [];

    // Filtrar por tipo y por bolsa
    const resultados = quotes
      .filter((q) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY'))
      .filter((q) => coincideBolsa(q, bolsa))
      .map((q) => ({
        ticker: q.symbol,
        nombre: q.longname || q.shortname || q.symbol,
        mercado: q.exchDisp || q.exchange || null,
        tipo: q.quoteType || null,
        exchange: q.exchange || null
      }))
      .slice(0, 10);

    return Response.json({ resultados, bolsa });
  } catch (err) {
    console.error('Error en /api/buscar:', err);
    return Response.json({ resultados: [] });
  }
}
