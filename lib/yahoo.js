// Descarga de velas históricas de Yahoo Finance

export async function descargarVelas(ticker, rango = '1y', intervalo = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${rango}&interval=${intervalo}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; V3/1.0)'
    }
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance respondió ${res.status}`);
  }

  const json = await res.json();
  const resultado = json?.chart?.result?.[0];
  if (!resultado) {
    throw new Error('Yahoo Finance no devolvió datos');
  }

  const timestamps = resultado.timestamp || [];
  const quote = resultado.indicators?.quote?.[0] || {};
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const closes = quote.close || [];
  const volumes = quote.volume || [];

  const velas = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (
      highs[i] === null || lows[i] === null || closes[i] === null ||
      highs[i] === undefined || lows[i] === undefined || closes[i] === undefined
    ) {
      continue;
    }
    velas.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i]
    });
  }

  return {
    velas,
    meta: resultado.meta || {}
  };
}

export async function infoTicker(query) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; V3/1.0)'
    }
  });

  if (!res.ok) {
    throw new Error(`Yahoo Search respondió ${res.status}`);
  }

  const json = await res.json();
  const quotes = json?.quotes || [];
  if (quotes.length === 0) {
    throw new Error('Ticker no encontrado en Yahoo');
  }

  // Priorizamos EQUITY (acciones) y luego lo que haya
  const equity = quotes.find((q) => q.quoteType === 'EQUITY');
  const quote = equity || quotes[0];

  return {
    ticker: quote.symbol,
    nombre: quote.longname || quote.shortname || quote.symbol,
    mercado: quote.exchDisp || quote.exchange || null,
    tipo: quote.quoteType || null,
    sector: quote.sector || null
  };
}

// Fundamentales desde ROIC.ai (free tier: 5 req/min, 2 años historial)
export async function infoFundamental(ticker) {
  const t = ticker.toUpperCase();
  const key = process.env.ROIC_API_KEY;

  if (!key) {
    console.log('[infoFundamental] ROIC_API_KEY no configurada');
    return null;
  }

  // ROIC.ai acepta tickers con exchange. Para Europa, el formato suele ser "BME:GRF" o similar.
  // Probamos primero con el ticker directo y si falla, sin sufijo.
  const symbol = t.includes('.') ? t.split('.')[0] : t;

  try {
    // Llamamos en paralelo a profitability y credit
    const [profRes, credRes] = await Promise.all([
      fetch(
        `https://api.roic.ai/v2/fundamental/ratios/profitability/${encodeURIComponent(
          symbol
        )}?apikey=${key}&limit=1`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.roic.ai/v2/fundamental/ratios/credit/${encodeURIComponent(
          symbol
        )}?apikey=${key}&limit=1`,
        { next: { revalidate: 3600 } }
      )
    ]);

    if (!profRes.ok || !credRes.ok) {
      console.log('[infoFundamental] ROIC status', profRes.status, credRes.status);
      return null;
    }

    const profData = await profRes.json();
    const credData = await credRes.json();

    // ROIC devuelve un array; cogemos el primer elemento (el más reciente)
    const p = Array.isArray(profData) && profData.length > 0 ? profData[0] : null;
    const c = Array.isArray(credData) && credData.length > 0 ? credData[0] : null;

    if (!p && !c) {
      console.log('[infoFundamental] ROIC sin datos para', symbol);
      return null;
    }

    // ROIC devuelve los ratios como porcentajes ya multiplicados (ej: 15.6 = 15.6%)
    // Según la doc, return_com_eqy es 156.19 para AAPL (que es 156%), así que viene en porcentaje.
    return {
      ticker: t,
      nombre: null,
      sector: null,
      industria: null,
      marketCap: null, // No viene en estos endpoints
      dividendYield: null, // No viene en estos endpoints
      per: null, // No viene en estos endpoints
      priceToBook: null, // No viene en estos endpoints
      max52: null,
      min52: null,
      // De profitability
      roe: p?.return_com_eqy ?? null,
      margenNeto: p?.profit_margin ?? null,
      margenEbitda: p?.ebitda_margin ?? null,
      // De credit
      deudaEbitda: c?.debt_to_ebitda ?? c?.net_debt_to_ebitda ?? null,
      deudaEquity: c?.debt_to_equity ?? null
    };
  } catch (e) {
    console.log('[infoFundamental] error', e.message);
    return null;
  }
}
