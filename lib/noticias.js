// Obtención de noticias desde Yahoo Finance (endpoint público)

export async function obtenerNoticias(ticker, max = 5) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=${max}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; V3/1.0)'
      }
    });

    if (!res.ok) return [];

    const json = await res.json();
    const news = json?.news || [];

    return news.slice(0, max).map((n) => ({
      titulo: n.title,
      fuente: n.publisher || null,
      url: n.link,
      fecha_publicacion: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : null
    }));
  } catch (err) {
    console.error('Error en obtenerNoticias:', err);
    return [];
  }
}
