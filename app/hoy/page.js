import { supabaseAdmin } from '../../lib/supabaseAdmin';
import ListaCambiosZona from '../../components/ListaCambiosZona';
import RankingTabla from '../../components/RankingTabla';

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
  if (sesiones >= velas.length - 1) primero = velas[0]?.close;
  else primero = velas[velas.length - sesiones - 1]?.close;
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

async function cargarCambios24h() {
  try {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cambios } = await supabaseAdmin
      .from('cambios_movimiento')
      .select('ticker, movimiento_anterior, movimiento_nuevo, detectado_at')
      .gte('detectado_at', hace24h)
      .order('detectado_at', { ascending: false })
      .limit(20);

    if (!cambios || cambios.length === 0) return [];

    const tickers = cambios.map((c) => c.ticker);
    const { data: empresas } = await supabaseAdmin
      .from('empresas')
      .select('ticker, nombre, sector')
      .in('ticker', tickers);

    const map = {};
    for (const e of empresas || []) {
      if (e && e.ticker) map[e.ticker] = e;
    }

    return cambios.map((c) => ({
      ticker: c.ticker,
      nombre: map[c.ticker]?.nombre || c.ticker,
      sector: map[c.ticker]?.sector || null,
      categoriaAnterior:
        c.movimiento_anterior === 'venta'
          ? 'A'
          : c.movimiento_anterior === 'compra'
          ? 'C'
          : 'B',
      categoriaNueva:
        c.movimiento_nuevo === 'venta'
          ? 'A'
          : c.movimiento_nuevo === 'compra'
          ? 'C'
          : 'B'
    }));
  } catch (e) {
    console.error('[hoy] Error cambios:', e.message);
    return [];
  }
}

async function cargarTop5() {
  try {
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos')
      .order('actualizado_at', { ascending: false })
      .limit(500);

    if (!paginas || paginas.length === 0) return { items: [], total: 0 };

    const tickers = paginas.map((p) => p.ticker);
    const { data: empresas } = await supabaseAdmin
      .from('empresas')
      .select('ticker, nombre, sector')
      .in('ticker', tickers);

    const map = {};
    for (const e of empresas || []) {
      if (e && e.ticker) map[e.ticker] = e;
    }

    const items = [];
    for (const p of paginas) {
      const datos = parseDatos(p.datos);
      if (!datos) continue;
      const emp = map[p.ticker];
      const velas = datos.velasUltimas60 || [];
      const smis = datos.smisUltimos60 || [];
      const v5 = calcularVariacion(velas, 5);
      if (v5 === null) continue;

      const percentil = calcularPercentil(smis, datos.smiActual);

      items.push({
        ticker: p.ticker,
        nombre: emp?.nombre || p.ticker,
        sector: emp?.sector || null,
        precio: datos.precioActual,
        variacion5: v5,
        variacion60: calcularVariacion(velas, 60),
        percentil,
        zona: datos.zona
      });
    }

    const ordenado = items.sort((a, b) => b.variacion5 - a.variacion5);
    return { items: ordenado.slice(0, 10), total: ordenado.length };
  } catch (e) {
    console.error('[hoy] Error top:', e.message);
    return { items: [], total: 0 };
  }
}

export default async function PaginaHoy() {
  const [cambios, top] = await Promise.all([cargarCambios24h(), cargarTop5()]);

  return (
    <main className="v3-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1>Hoy</h1>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
        Resumen de lo que ha cambiado en las últimas 24 horas. Datos históricos descriptivos. No
        predictivos. No constituyen recomendación de inversión.
      </p>

      <ListaCambiosZona cambios={cambios} />
      <RankingTabla
        items={top.items}
        tipo="variacion5"
        titulo="Top 10 por variación en 5 sesiones"
        total={top.total}
      />
    </main>
  );
}
