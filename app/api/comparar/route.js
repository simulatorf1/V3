import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function parseDatos(datos) {
  if (!datos) return null;
  if (typeof datos === 'string') {
    try {
      return JSON.parse(datos);
    } catch (e) {
      return null;
    }
  }
  return datos;
}

function calcularVariacion(velas, sesiones) {
  if (!velas || velas.length < 2) return null;
  let primero;
  if (sesiones >= velas.length - 1) {
    primero = velas[0]?.close;
  } else {
    primero = velas[velas.length - sesiones - 1]?.close;
  }
  const ultimo = velas[velas.length - 1]?.close;
  if (!primero || primero === 0) return null;
  return ((ultimo - primero) / primero) * 100;
}

function calcularPercentil(smis, smiActual) {
  if (!smis || smis.length === 0 || smiActual === null || smiActual === undefined) return null;
  const validos = smis.filter((v) => v !== null && v !== undefined);
  if (validos.length === 0) return null;
  const menores = validos.filter((v) => v < smiActual).length;
  return Math.round((menores / validos.length) * 100);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers') || '';

  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);

  if (tickers.length === 0) {
    return Response.json({ empresas: [], noEncontrados: [] });
  }

  try {
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos')
      .in('ticker', tickers);

    const { data: empresasData } = await supabaseAdmin
      .from('empresas')
      .select('ticker, nombre, sector')
      .in('ticker', tickers);

    const empresasMap = {};
    for (const e of empresasData || []) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const encontrados = new Set();
    const empresas = [];

    for (const p of paginas || []) {
      const datos = parseDatos(p.datos);
      if (!datos) continue;

      const emp = empresasMap[p.ticker];
      const velas = datos.velasUltimas60 || [];
      const smis = datos.smisUltimos60 || [];

      empresas.push({
        ticker: p.ticker,
        nombre: emp?.nombre || p.ticker,
        sector: emp?.sector || null,
        precio: datos.precioActual ?? null,
        zona: datos.zona || null,
        smiActual: datos.smiActual ?? null,
        variacion5: calcularVariacion(velas, 5),
        variacion60: calcularVariacion(velas, 60),
        percentil: calcularPercentil(smis, datos.smiActual),
        variacionSector60: datos.sectorInfo?.variacionSector60 ?? null,
        minimo60: velas.length > 0 ? Math.min(...velas.map((v) => v.low)) : null,
        maximo60: velas.length > 0 ? Math.max(...velas.map((v) => v.high)) : null
      });
      encontrados.add(p.ticker);
    }

    const noEncontrados = tickers.filter((t) => !encontrados.has(t));

    return Response.json({ empresas, noEncontrados });
  } catch (err) {
    console.error('Error en /api/comparar:', err);
    return Response.json(
      { empresas: [], noEncontrados: tickers, error: err.message },
      { status: 200 }
    );
  }
}
