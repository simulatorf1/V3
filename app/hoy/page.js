import Link from 'next/link';
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

function calcularRachaZona(smis, zonaActual) {
  if (!smis || smis.length === 0 || !zonaActual) return { racha: 0, zona: null };
  let racha = 0;
  for (let i = smis.length - 1; i >= 0; i--) {
    const s = smis[i];
    if (s === null || s === undefined) break;
    let zona;
    if (s > 40) zona = 'alta';
    else if (s < -40) zona = 'baja';
    else zona = 'intermedia';
    if (zona === zonaActual) racha++;
    else break;
  }
  return { racha, zona: zonaActual };
}

function etiquetaZona(zona) {
  if (zona === 'alta') return { texto: 'parte alta', clase: 'v3-zona-alta' };
  if (zona === 'baja') return { texto: 'parte baja', clase: 'v3-zona-baja' };
  return { texto: 'parte intermedia', clase: 'v3-zona-intermedia' };
}

function construirSlug(item) {
  const nombreLimpio = (item.nombre || item.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${item.ticker.toLowerCase()}__${nombreLimpio}`;
}

async function cargarCambios24h() {
  try {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cambios } = await supabaseAdmin
      .from('cambios_movimiento')
      .select('ticker, movimiento_anterior, movimiento_nuevo, detectado_at')
      .gte('detectado_at', hace24h)
      .order('detectado_at', { ascending: false })
      .limit(40);

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
        c.movimiento_anterior === 'venta' ? 'A' : c.movimiento_anterior === 'compra' ? 'C' : 'B',
      categoriaNueva:
        c.movimiento_nuevo === 'venta' ? 'A' : c.movimiento_nuevo === 'compra' ? 'C' : 'B'
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
      items.push({
        ticker: p.ticker,
        nombre: emp?.nombre || p.ticker,
        sector: emp?.sector || null,
        precio: datos.precioActual,
        variacion5: v5,
        variacion60: calcularVariacion(velas, 60),
        percentil: calcularPercentil(smis, datos.smiActual),
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

async function cargarRachas() {
  try {
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos')
      .order('actualizado_at', { ascending: false })
      .limit(500);

    if (!paginas || paginas.length === 0) return [];

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
      const smis = datos.smisUltimos60 || [];
      const zona = datos.zona;
      if (!zona) continue;
      const { racha } = calcularRachaZona(smis, zona);
      if (racha < 3) continue;
      items.push({
        ticker: p.ticker,
        nombre: emp?.nombre || p.ticker,
        sector: emp?.sector || null,
        zona,
        racha
      });
    }

    return items.sort((a, b) => b.racha - a.racha);
  } catch (e) {
    console.error('[hoy] Error rachas:', e.message);
    return [];
  }
}

export default async function PaginaHoy() {
  const [cambios, top, rachas] = await Promise.all([
    cargarCambios24h(),
    cargarTop5(),
    cargarRachas()
  ]);

  const rachasAltas = rachas.filter((r) => r.zona === 'alta').slice(0, 5);
  const rachasBajas = rachas.filter((r) => r.zona === 'baja').slice(0, 5);

  return (
    <main className="v3-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1>Hoy</h1>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
        Resumen de lo que ha cambiado en las últimas 24 horas. Datos históricos descriptivos. No
        predictivos. No constituyen recomendación de inversión.
      </p>

      <ListaCambiosZona cambios={cambios} />

      {(rachasAltas.length > 0 || rachasBajas.length > 0) && (
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Rachas más largas</h2>
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
            Empresas con más sesiones consecutivas en la misma zona del rango de 60 sesiones.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '12px'
            }}
          >
            {rachasAltas.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--v3-text-mute)',
                    margin: '0 0 8px 0'
                  }}
                >
                  En parte alta
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                  {rachasAltas.map((r) => (
                    <li key={r.ticker}>
                      <Link
                        href={`/analisis/${construirSlug(r)}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#fff',
                          border: '1px solid var(--v3-border)',
                          borderRadius: 'var(--v3-radius-sm)',
                          textDecoration: 'none',
                          color: 'var(--v3-text)',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                        <span style={{ color: 'var(--v3-text-soft)', fontSize: '12px' }}>
                          {r.racha} sesiones
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rachasBajas.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--v3-text-mute)',
                    margin: '0 0 8px 0'
                  }}
                >
                  En parte baja
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                  {rachasBajas.map((r) => (
                    <li key={r.ticker}>
                      <Link
                        href={`/analisis/${construirSlug(r)}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#fff',
                          border: '1px solid var(--v3-border)',
                          borderRadius: 'var(--v3-radius-sm)',
                          textDecoration: 'none',
                          color: 'var(--v3-text)',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{r.nombre}</span>
                        <span style={{ color: 'var(--v3-text-soft)', fontSize: '12px' }}>
                          {r.racha} sesiones
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <RankingTabla
        items={top.items}
        tipo="variacion5"
        titulo="Top 10 por variación en 5 sesiones"
        total={top.total}
      />

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link
          href="/cambios"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: 'var(--v3-radius-sm)',
            border: '1px solid var(--v3-border-strong)',
            background: '#fff',
            color: 'var(--v3-text)',
            textDecoration: 'none'
          }}
        >
          Ver historial completo de cambios de zona
        </Link>
      </div>
    </main>
  );
}
