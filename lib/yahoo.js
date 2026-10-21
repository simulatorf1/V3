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

// NUEVO: fundamentales desde Yahoo quoteSummary
export async function infoFundamental(ticker) {
  const t = ticker.toUpperCase();
  const modules = [
    'defaultKeyStatistics',
    'financialData',
    'summaryDetail',
    'calendarEvents',
    'assetProfile'
  ].join(',');

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    t
  )}?modules=${modules}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const stats = result.defaultKeyStatistics || {};
    const fin = result.financialData || {};
    const summary = result.summaryDetail || {};
    const calendar = result.calendarEvents || {};
    const profile = result.assetProfile || {};

    // Deuda Neta / EBITDA = (deuda total - caja) / EBITDA
    let deudaNetaEbitda = null;
    if (fin.totalDebt?.raw !== undefined && fin.ebitda?.raw !== undefined && fin.ebitda.raw !== 0) {
      const deudaNeta = fin.totalDebt.raw - (fin.totalCash?.raw || 0);
      deudaNetaEbitda = deudaNeta / fin.ebitda.raw;
    }

    const roe = fin.returnOnEquity?.raw ?? null;
    const margenNeto = fin.profitMargins?.raw ?? stats.profitMargins?.raw ?? null;
    const fcf = fin.freeCashflow?.raw ?? null;
    const dividendYield = summary.dividendYield?.raw ?? null;
    const marketCap = summary.marketCap?.raw ?? null;

    // Próxima fecha de resultados (Yahoo devuelve timestamp UNIX en segundos)
    let proximosResultados = null;
    if (
      calendar.earningsDate &&
      Array.isArray(calendar.earningsDate) &&
      calendar.earningsDate[0]?.raw
    ) {
      proximosResultados = new Date(calendar.earningsDate[0].raw * 1000)
        .toISOString()
        .slice(0, 10);
    }

    return {
      ticker: t,
      nombre: profile.longName || profile.shortName || null,
      sector: profile.sector || null,
      industria: profile.industry || null,
      marketCap,
      dividendYield,
      deudaNetaEbitda,
      roe,
      margenNeto,
      fcf,
      proximosResultados
    };
  } catch (e) {
    console.error('Error Yahoo fundamentales:', e.message);
    return null;
  }
}
