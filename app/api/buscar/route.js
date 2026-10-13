// Ruta API que consulta Yahoo Finance y devuelve los resultados al buscador

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return Response.json({ resultados: [] });
  }

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`;

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

    // Filtramos: solo acciones, ETFs y cripto con ticker válido
    const resultados = quotes
      .filter((q) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY'))
      .map((q) => ({
        ticker: q.symbol,
        nombre: q.longname || q.shortname || q.symbol,
        mercado: q.exchDisp || q.exchange || null,
        tipo: q.quoteType || null
      }))
      .slice(0, 10);

    return Response.json({ resultados });
  } catch (err) {
    console.error('Error en /api/buscar:', err);
    return Response.json({ resultados: [] });
  }
}
