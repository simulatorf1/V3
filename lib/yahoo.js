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

// Fundamentales desde Yahoo v7/quote (funciona sin crumb desde servidor)
export async function infoFundamental(ticker) {
  const t = ticker.toUpperCase();

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    t
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.log('[infoFundamental] status', res.status);
      return null;
    }

    const json = await res.json();
    const q = json?.quoteResponse?.result?.[0];
    if (!q) {
      console.log('[infoFundamental] sin resultado', json);
      return null;
    }

    return {
      ticker: t,
      nombre: q.longName || q.shortName || null,
      sector: q.sector || null,
      industria: q.industry || null,
      marketCap: q.marketCap ?? null,
      dividendYield: q.dividendYield ?? null,
      per: q.trailingPE ?? null,
      priceToBook: q.priceToBook ?? null,
      max52: q.fiftyTwoWeekHigh ?? null,
      min52: q.fiftyTwoWeekLow ?? null,
      // Estos no vienen en v7. Los dejamos en null para que el componente los oculte.
      deudaNetaEbitda: null,
      roe: null,
      margenNeto: null,
      fcf: null,
      proximosResultados: null
    };
  } catch (e) {
    console.log('[infoFundamental] error', e.message);
    return null;
  }
}
