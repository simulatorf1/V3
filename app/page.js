import Link from 'next/link';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import Buscador from '../components/Buscador';
import WatchlistZona from '../components/WatchlistZona';
import ActividadFavoritos from '../components/ActividadFavoritos';
import RegistrarVisitaGlobal from '../components/RegistrarVisitaGlobal';
import FiltroBolsa from '../components/FiltroBolsa';
import ComparadorHome from '../components/ComparadorHome';
import { bolsaDesdeTicker } from '../lib/bolsas';

export const revalidate = 3600;

function TablaTop({ titulo, items, color }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#666', marginBottom: '8px' }}>
          {titulo}
        </div>
        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Sin datos.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '6px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#666', marginBottom: '6px' }}>
        {titulo}
      </div>
      <div style={{ display: 'grid', gap: 0 }}>
        {items.map((e, i) => (
          <Link
            key={e.ticker}
            href={`/analisis/${e.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 4px',
              borderBottom: i < items.length - 1 ? '1px solid #1a1a1a' : 'none',
              textDecoration: 'none',
              color: '#e5e5e5',
              fontSize: '12px'
            }}
          >
            <span style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
              <span style={{ fontSize: '10px', color: '#555', fontWeight: 600, minWidth: '14px' }}>{i + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre}</span>
            </span>
            <strong style={{ color, fontSize: '12px', marginLeft: '8px' }}>{e.pct_subidas_diario}%</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniRadar({ empresas }) {
  if (!empresas || empresas.length === 0) return null;
  const seleccionadas = empresas.filter((e) => e.percentil !== null && e.percentil <= 20).sort((a, b) => a.percentil - b.percentil).slice(0, 5);
  if (seleccionadas.length === 0) return null;
  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#666', marginBottom: '6px' }}>
        Radar de coincidencias · percentil ≤ 20
      </div>
      <div style={{ display: 'grid', gap: 0, background: '#111', border: '1px solid #222', borderRadius: '6px', overflow: 'hidden' }}>
        {seleccionadas.map((e, i) => (
          <Link
            key={e.ticker}
            href={`/analisis/${e.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: i < seleccionadas.length - 1 ? '1px solid #1a1a1a' : 'none',
              textDecoration: 'none',
              color: '#e5e5e5',
              fontSize: '12px'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre}</span>
            <span style={{ display: 'flex', gap: '12px', fontSize: '11px', marginLeft: '8px' }}>
              <span style={{ color: '#888' }}>P: <strong style={{ color: '#e5e5e5' }}>{e.percentil}</strong></span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{e.pct_subidas_diario}%</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function cargarHome(bolsa) {
  const { data: paginas } = await supabaseAdmin
    .from('paginas')
    .select('ticker, slug, percentil, zona, variacion60, pct_subidas_diario, pct_subidas_semanal, retorno_medio_diario, retorno_medio_semanal, casos_diario, casos_semanal')
    .not('pct_subidas_diario', 'is', null);

  if (!paginas || paginas.length === 0) return { topSubida: [], topBajada: [], contexto: null, empresasFavoritos: [], todas: [] };

  const tickers = paginas.map((p) => p.ticker);
  const { data: empresas } = await supabaseAdmin.from('empresas').select('ticker, nombre, sector, mercado').in('ticker', tickers);
  const mapaEmpresas = {};
  for (const e of empresas || []) mapaEmpresas[e.ticker] = e;

  const todas = paginas.map((p) => ({ ...p, nombre: mapaEmpresas[p.ticker]?.nombre || p.ticker, sector: mapaEmpresas[p.ticker]?.sector || null, bolsa: bolsaDesdeTicker(p.ticker) })).filter((e) => e.bolsa === bolsa);

  const topSubida = todas.filter((e) => e.percentil !== null && e.percentil <= 30).sort((a, b) => b.pct_subidas_diario - a.pct_subidas_diario).slice(0, 10);
  const topBajada = todas.filter((e) => e.percentil !== null && e.percentil >= 70).sort((a, b) => a.pct_subidas_diario - b.pct_subidas_diario).slice(0, 10);

  const zonaBaja = todas.filter((e) => e.zona === 'baja').length;
  const zonaAlta = todas.filter((e) => e.zona === 'alta').length;
  const zonaMedia = todas.filter((e) => e.zona === 'media').length;

  const empresasFavoritos = todas.map((e) => ({ ticker: e.ticker, nombre: e.nombre, sector: e.sector, zona: e.zona, variacion60: e.variacion60 }));

  return { topSubida, topBajada, contexto: { zonaBaja, zonaAlta, zonaMedia, total: todas.length }, empresasFavoritos, todas };
}

export default async function Home({ searchParams }) {
  const bolsa = searchParams?.bolsa || 'mc';
  const { topSubida, topBajada, contexto, empresasFavoritos, todas } = await cargarHome(bolsa);

  const statCardStyle = { padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '6px' };
  const statLabelStyle = { fontSize: '10px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' };
  const statValueStyle = { fontSize: '20px', fontWeight: 800, color: '#f5f5f5', lineHeight: 1.1 };

  return (
    <div className="home-dark" style={{ minHeight: '100vh', paddingBottom: '32px' }}>
      <RegistrarVisitaGlobal />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>

        {/* Header compacto */}
        <header style={{ padding: '20px 0 14px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f5f5f5' }}>Equaty</h1>
            <p style={{ color: '#666', fontSize: '11px', margin: '2px 0 0' }}>
              Análisis estadístico de empresas cotizadas · No es recomendación de inversión
            </p>
          </div>
        </header>

        {/* Buscador */}
        <div style={{ marginTop: '14px' }}>
          <Buscador dark bolsaActual={bolsa} />
        </div>

        {/* Favoritos */}
        <div style={{ marginTop: '12px' }}>
          <WatchlistZona>
            <ActividadFavoritos empresas={empresasFavoritos} modo="compacto" />
          </WatchlistZona>
        </div>

        {/* Comparador */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#666', marginBottom: '6px' }}>
            Comparador
          </div>
          <ComparadorHome />
        </div>

        {/* Rankings */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#666' }}>
              Rankings · {todas.length} empresas
            </div>
            <FiltroBolsa valorActual={bolsa} dark />
          </div>

          {contexto && contexto.total > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Zona baja</div>
                <div style={{ ...statValueStyle, color: '#22c55e' }}>{contexto.zonaBaja}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Zona media</div>
                <div style={statValueStyle}>{contexto.zonaMedia}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Zona alta</div>
                <div style={{ ...statValueStyle, color: '#ef4444' }}>{contexto.zonaAlta}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Total</div>
                <div style={statValueStyle}>{contexto.total}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
            <TablaTop titulo="Top 10 · mayor probabilidad de subida" items={topSubida} color="#22c55e" />
            <TablaTop titulo="Top 10 · mayor probabilidad de bajada" items={topBajada} color="#ef4444" />
          </div>

          <p style={{ fontSize: '10px', color: '#555', marginTop: '8px', lineHeight: 1.5 }}>
            Ranking calculado sobre el porcentaje de subidas en casos históricos similares. No es una predicción ni una recomendación de inversión.
          </p>

          <MiniRadar empresas={todas} />
        </div>

        {/* Herramientas */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#666', marginBottom: '6px' }}>
            Más herramientas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <Link href="/sectores" style={{ display: 'block', padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '6px', textDecoration: 'none', color: '#e5e5e5' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>Sectores</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Empresas agrupadas por sector</div>
            </Link>
            <Link href="/radar" style={{ display: 'block', padding: '10px 12px', background: '#111', border: '1px solid #222', borderRadius: '6px', textDecoration: 'none', color: '#e5e5e5' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>Radar completo</div>
              <div style={{ fontSize: '11px', color: '#666' }}>Filtra por percentil y zona</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
