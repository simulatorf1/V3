// Descarga de velas históricas de Yahoo Finance
// Endpoint público: https://query1.finance.yahoo.com/v8/finance/chart/{ticker}

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

export async function infoTicker(ticker) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=0`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; V3/1.0)'
    }
  });

  if (!res.ok) {
    throw new Error(`Yahoo Search respondió ${res.status}`);
  }

  const json = await res.json();
  const quote = json?.quotes?.[0];
  if (!quote) {
    throw new Error('Ticker no encontrado en Yahoo');
  }

  return {
    ticker: quote.symbol,
    nombre: quote.longname || quote.shortname || quote.symbol,
    mercado: quote.exchDisp || quote.exchange || null,
    tipo: quote.quoteType || null,
    sector: quote.sector || null
  };
}
