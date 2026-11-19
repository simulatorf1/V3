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
      <div className="home-dark" style={{ padding: '20px', background: 'var(--home-bg-card)', border: '1px solid var(--home-border)', borderRadius: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--home-text-mute)', marginBottom: '12px' }}>
          {titulo}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--home-text-mute)', margin: 0 }}>Sin datos para esta bolsa todavía.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: '20px', background: 'var(--home-bg-card)', border: '1px solid var(--home-border)', borderRadius: '8px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--home-text-mute)', marginBottom: '12px' }}>
        {titulo}
      </div>
      <div style={{ display: 'grid', gap: '2px' }}>
        {items.map((e, i) => (
          <Link
            key={e.ticker}
            href={`/analisis/${e.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: '4px',
              background: 'transparent',
              textDecoration: 'none',
              color: 'var(--home-text)',
              fontSize: '13px',
              borderBottom: '1px solid var(--home-border)'
            }}
          >
            <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--home-text-mute)', fontWeight: 600, minWidth: '16px' }}>{i + 1}</span>
              <span>{e.nombre}</span>
            </span>
            <strong style={{ color, fontSize: '14px' }}>{e.pct_subidas_diario}%</strong>
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
    <section style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--home-text)' }}>Radar de coincidencias</h2>
      <p style={{ fontSize: '13px', color: 'var(--home-text-soft)', marginBottom: '16px' }}>
        Empresas con el indicador Equaty en zona baja (percentil ≤ 20).
      </p>
      <div style={{ display: 'grid', gap: '2px' }}>
        {seleccionadas.map((e) => (
          <Link key={e.ticker} href={`/analisis/${e.slug}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--home-bg-card)', border: '1px solid var(--home-border)', borderRadius: '6px', textDecoration: 'none', color: 'var(--home-text)', fontSize: '13px' }}>
            <span>{e.nombre}</span>
            <span style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <span style={{ color: 'var(--home-text-soft)' }}>Percentil: <strong style={{ color: 'var(--home-text)' }}>{e.percentil}</strong></span>
              <span style={{ color: 'var(--home-green)', fontWeight: 700 }}>{e.pct_subidas_diario}% subidas</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
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

  const statCardStyle = { padding: '20px', background: 'var(--home-bg-card)', border: '1px solid var(--home-border)', borderRadius: '8px' };
  const statLabelStyle = { fontSize: '11px', color: 'var(--home-text-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' };
  const statValueStyle = { fontSize: '28px', fontWeight: 800, color: 'var(--home-text)' };

  return (
    <div className="home-dark" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <RegistrarVisitaGlobal />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>

        <header style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--home-border)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Equaty</h1>
          <p style={{ color: 'var(--home-text-soft)', fontSize: '14px', margin: '8px 0 0', maxWidth: '600px' }}>
            Análisis estadístico de empresas cotizadas. Datos históricos descriptivos. No es recomendación de inversión.
          </p>
        </header>

        <section style={{ marginTop: '32px' }}>
          <Buscador dark />
        </section>

        <WatchlistZona>
          <ActividadFavoritos empresas={empresasFavoritos} modo="compacto" />
        </WatchlistZona>

        <section style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Comparador</h2>
          <ComparadorHome />
        </section>

        <section style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Rankings · {todas.length} empresas</h2>
            <FiltroBolsa valorActual={bolsa} dark />
          </div>

          {contexto && contexto.total > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Zona baja</div>
                <div style={{ ...statValueStyle, color: 'var(--home-green)' }}>{contexto.zonaBaja}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Zona media</div>
                <div style={statValueStyle}>{contexto.zonaMedia}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Zona alta</div>
                <div style={{ ...statValueStyle, color: 'var(--home-red)' }}>{contexto.zonaAlta}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Total</div>
                <div style={statValueStyle}>{contexto.total}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <TablaTop titulo="Top 10 · mayor probabilidad de subida" items={topSubida} color="var(--home-green)" />
            <TablaTop titulo="Top 10 · mayor probabilidad de bajada" items={topBajada} color="var(--home-red)" />
          </div>

          <p style={{ fontSize: '11px', color: 'var(--home-text-mute)', marginTop: '16px', lineHeight: 1.6 }}>
            Ranking calculado sobre el porcentaje de subidas en casos históricos similares. No es una predicción ni una recomendación de inversión.
          </p>

          <MiniRadar empresas={todas} />
        </section>

        <section style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Más herramientas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <Link href="/sectores" style={{ display: 'block', padding: '20px', background: 'var(--home-bg-card)', border: '1px solid var(--home-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--home-text)' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Sectores</div>
              <div style={{ fontSize: '12px', color: 'var(--home-text-soft)' }}>Explora las empresas agrupadas por sector.</div>
            </Link>
            <Link href="/radar" style={{ display: 'block', padding: '20px', background: 'var(--home-bg-card)', border: '1px solid var(--home-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--home-text)' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Radar completo</div>
              <div style={{ fontSize: '12px', color: 'var(--home-text-soft)' }}>Filtra por percentil, zona y probabilidad histórica.</div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
