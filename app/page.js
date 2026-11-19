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

const BASE_URL = 'https://equaty.es';

function TablaTop({ titulo, items, color }) {
  if (!items || items.length === 0) {
    return (
      <div className="v3-card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--v3-text-mute)', marginBottom: '10px' }}>
          {titulo}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--v3-text-mute)', margin: 0 }}>
          Sin datos para esta bolsa todavía.
        </p>
      </div>
    );
  }
  return (
    <div className="v3-card" style={{ padding: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--v3-text-mute)', marginBottom: '10px' }}>
        {titulo}
      </div>
      <div style={{ display: 'grid', gap: '4px' }}>
        {items.map((e, i) => (
          <Link
            key={e.ticker}
            href={`/analisis/${e.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--v3-border)',
              background: '#fff',
              textDecoration: 'none',
              color: 'var(--v3-text)',
              fontSize: '13px'
            }}
          >
            <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600 }}>{i + 1}</span>
              <span>{e.nombre}</span>
            </span>
            <strong style={{ color }}>{e.pct_subidas_diario}%</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniRadar({ empresas }) {
  if (!empresas || empresas.length === 0) return null;
  const seleccionadas = empresas
    .filter((e) => e.percentil !== null && e.percentil <= 20)
    .sort((a, b) => a.percentil - b.percentil)
    .slice(0, 5);

  if (seleccionadas.length === 0) return null;

  return (
    <section className="v3-seccion" style={{ marginTop: '24px' }}>
      <h2 className="v3-seccion-titulo">Radar de coincidencias</h2>
      <p style={{ fontSize: '13px', color: 'var(--v3-text-soft)', marginTop: '-4px', marginBottom: '12px' }}>
        Empresas con el indicador Equaty en zona baja (percentil ≤ 20).
      </p>
      <div style={{ display: 'grid', gap: '6px' }}>
        {seleccionadas.map((e) => (
          <Link
            key={e.ticker}
            href={`/analisis/${e.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--v3-border)',
              background: '#fff',
              textDecoration: 'none',
              color: 'var(--v3-text)',
              fontSize: '13px'
            }}
          >
            <span>{e.nombre}</span>
            <span style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span>Percentil: <strong>{e.percentil}</strong></span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{e.pct_subidas_diario}% subidas</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function cargarHome(bolsa) {
  // 1 consulta ligera a paginas (sin filtrar por bolsa en SQL, filtramos en JS)
  const { data: paginas } = await supabaseAdmin
    .from('paginas')
    .select('ticker, slug, percentil, zona, variacion60, pct_subidas_diario, pct_subidas_semanal, retorno_medio_diario, retorno_medio_semanal, casos_diario, casos_semanal')
    .not('pct_subidas_diario', 'is', null);

  if (!paginas || paginas.length === 0) {
    return { topSubida: [], topBajada: [], contexto: null, empresasFavoritos: [], todas: [] };
  }

  const tickers = paginas.map((p) => p.ticker);
  const { data: empresas } = await supabaseAdmin
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .in('ticker', tickers);

  const mapaEmpresas = {};
  for (const e of empresas || []) mapaEmpresas[e.ticker] = e;

  // Enriquecer y filtrar por bolsa en JS (no en SQL, para no añadir consultas)
  const todas = paginas
    .map((p) => ({
      ...p,
      nombre: mapaEmpresas[p.ticker]?.nombre || p.ticker,
      sector: mapaEmpresas[p.ticker]?.sector || null,
      mercado: mapaEmpresas[p.ticker]?.mercado || null,
      bolsa: bolsaDesdeTicker(p.ticker)
    }))
    .filter((e) => e.bolsa === bolsa);

  const topSubida = todas
    .filter((e) => e.percentil !== null && e.percentil <= 30)
    .sort((a, b) => b.pct_subidas_diario - a.pct_subidas_diario)
    .slice(0, 10);

  const topBajada = todas
    .filter((e) => e.percentil !== null && e.percentil >= 70)
    .sort((a, b) => a.pct_subidas_diario - b.pct_subidas_diario)
    .slice(0, 10);

  const zonaBaja = todas.filter((e) => e.zona === 'baja').length;
  const zonaAlta = todas.filter((e) => e.zona === 'alta').length;
  const zonaMedia = todas.filter((e) => e.zona === 'media').length;

  const empresasFavoritos = todas.map((e) => ({
    ticker: e.ticker,
    nombre: e.nombre,
    sector: e.sector,
    zona: e.zona,
    variacion60: e.variacion60
  }));

  return {
    topSubida,
    topBajada,
    contexto: { zonaBaja, zonaAlta, zonaMedia, total: todas.length },
    empresasFavoritos,
    todas
  };
}

export default async function Home({ searchParams }) {
  const bolsa = searchParams?.bolsa || 'mc';
  const { topSubida, topBajada, contexto, empresasFavoritos, todas } = await cargarHome(bolsa);

  return (
    <div className="v3-container">
      <RegistrarVisitaGlobal />

      <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>
        Equaty — Análisis bursátil estadístico
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--v3-text-soft)', fontSize: '14px', marginBottom: '24px' }}>
        Estadística histórica de empresas cotizadas. No es recomendación de inversión.
      </p>

      <div style={{ marginBottom: '24px' }}>
        <Buscador />
      </div>

      <WatchlistZona>
        <ActividadFavoritos empresas={empresasFavoritos} modo="compacto" />
      </WatchlistZona>

      {/* Comparador integrado en la home */}
      <section className="v3-seccion" style={{ marginTop: '24px' }}>
        <h2 className="v3-seccion-titulo">Comparador de empresas</h2>
        <p style={{ fontSize: '13px', color: 'var(--v3-text-soft)', marginTop: '-4px', marginBottom: '12px' }}>
          Compara hasta 4 empresas por su situación estadística. Busca por nombre y añádelas.
        </p>
        <ComparadorHome />
      </section>

      {/* Filtro de bolsa */}
      <section className="v3-seccion" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="v3-seccion-titulo" style={{ margin: 0 }}>
            Rankings y radar · {todas.length} empresas
          </h2>
          <FiltroBolsa valorActual={bolsa} />
        </div>

        {contexto && contexto.total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div className="v3-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>En zona baja</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>{contexto.zonaBaja}</div>
            </div>
            <div className="v3-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>En zona media</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{contexto.zonaMedia}</div>
            </div>
            <div className="v3-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>En zona alta</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626' }}>{contexto.zonaAlta}</div>
            </div>
            <div className="v3-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>Total analizadas</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{contexto.total}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <TablaTop titulo="Top 10 · mayor probabilidad histórica de subida" items={topSubida} color="#16a34a" />
          <TablaTop titulo="Top 10 · mayor probabilidad histórica de bajada" items={topBajada} color="#dc2626" />
        </div>

        <p style={{ fontSize: '11px', color: 'var(--v3-text-mute)', marginTop: '10px', lineHeight: 1.5 }}>
          Ranking calculado sobre el porcentaje de subidas en casos históricos similares. No es una predicción ni una recomendación de inversión.
        </p>

        <MiniRadar empresas={todas} />
      </section>

      <section className="v3-seccion" style={{ marginTop: '24px' }}>
        <h2 className="v3-seccion-titulo">Más herramientas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Link href="/sectores" style={{ display: 'block', padding: '16px', background: '#fff', border: '1px solid var(--v3-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--v3-text)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Sectores</div>
            <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)' }}>Explora las empresas agrupadas por sector.</div>
          </Link>
          <Link href="/radar" style={{ display: 'block', padding: '16px', background: '#fff', border: '1px solid var(--v3-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--v3-text)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Radar completo</div>
            <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)' }}>Filtra por percentil, zona y probabilidad histórica.</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
