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
  if (!velas || velas.length < sesiones + 1) return null;
  const primero = velas[velas.length - sesiones - 1]?.close;
  const ultimo = velas[velas.length - 1]?.close;
  if (!primero) return null;
  return ((ultimo - primero) / primero) * 100;
}

function calcularPercentil(smis, smiActual) {
  if (!smis || smis.length === 0 || smiActual === null || smiActual === undefined) {
    return null;
  }
  const validos = smis.filter((v) => v !== null && v !== undefined);
  if (validos.length === 0) return null;
  const menores = validos.filter((v) => v < smiActual).length;
  return Math.round((menores / validos.length) * 100);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'variacion60';
  const limite = Math.min(50, parseInt(searchParams.get('limite') || '20', 10));

  try {
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos, actualizado_at')
      .order('actualizado_at', { ascending: false })
      .limit(500);

    if (!paginas || paginas.length === 0) {
      return Response.json({ items: [] });
    }

    const tickers = paginas.map((p) => p.ticker);
    const { data: empresas } = await supabaseAdmin
      .from('empresas')
      .select('ticker, nombre, sector')
      .in('ticker', tickers);

    const empresasMap = {};
    for (const e of empresas || []) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const items = [];
    for (const p of paginas) {
      const datos = parseDatos(p.datos);
      if (!datos) continue;

      const emp = empresasMap[p.ticker];
      const velas = datos.velasUltimas60 || [];
      const smis = datos.smisUltimos60 || [];
      const smiActual = datos.smiActual;
      const precioActual = datos.precioActual;
      const zona = datos.zona;

      const variacion5 = calcularVariacion(velas, 5);
      const variacion60 = calcularVariacion(velas, 60);
      const percentil = calcularPercentil(smis, smiActual);

      items.push({
        ticker: p.ticker,
        nombre: emp?.nombre || p.ticker,
        sector: emp?.sector || null,
        precio: precioActual ?? null,
        variacion5,
        variacion60,
        percentil,
        zona: zona || null,
        smiActual: smiActual ?? null,
        variacionSector60: datos.sectorInfo?.variacionSector60 ?? null
      });
    }

    let resultado = [];

    if (tipo === 'variacion5') {
      resultado = items
        .filter((i) => i.variacion5 !== null)
        .sort((a, b) => b.variacion5 - a.variacion5)
        .slice(0, limite);
    } else if (tipo === 'variacion60') {
      resultado = items
        .filter((i) => i.variacion60 !== null)
        .sort((a, b) => b.variacion60 - a.variacion60)
        .slice(0, limite);
    } else if (tipo === 'percentil') {
      resultado = items
        .filter((i) => i.percentil !== null)
        .sort((a, b) => b.percentil - a.percentil)
        .slice(0, limite);
    } else if (tipo === 'extremos_altos') {
      resultado = items
        .filter((i) => i.percentil !== null && i.percentil >= 90)
        .sort((a, b) => b.percentil - a.percentil)
        .slice(0, limite);
    } else if (tipo === 'extremos_bajos') {
      resultado = items
        .filter((i) => i.percentil !== null && i.percentil <= 10)
        .sort((a, b) => a.percentil - b.percentil)
        .slice(0, limite);
    } else if (tipo === 'extremos') {
      const altos = items
        .filter((i) => i.percentil !== null && i.percentil >= 90)
        .sort((a, b) => b.percentil - a.percentil)
        .slice(0, Math.floor(limite / 2));
      const bajos = items
        .filter((i) => i.percentil !== null && i.percentil <= 10)
        .sort((a, b) => a.percentil - b.percentil)
        .slice(0, Math.floor(limite / 2));
      resultado = [...altos, ...bajos];
    }

    return Response.json({ items: resultado, tipo });
  } catch (err) {
    console.error('Error en /api/ranking:', err);
    return Response.json({ items: [], error: err.message }, { status: 200 });
  }
}
