import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import ComparadorSelector from '../../components/ComparadorSelector';

export const revalidate = 3600;

const BASE_URL = 'https://equaty.es';

function formatPct(v) {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

async function cargarComparacion(tickers) {
  if (!tickers || tickers.length === 0) return [];

  const { data: paginas } = await supabaseAdmin
    .from('paginas')
    .select('ticker, percentil, zona, variacion60, pct_subidas_diario, pct_subidas_semanal, retorno_medio_diario, retorno_medio_semanal, casos_diario, casos_semanal, smi_ultimos_3')
    .in('ticker', tickers);

  const { data: empresas } = await supabaseAdmin
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .in('ticker', tickers);

  const mapaEmpresas = {};
  for (const e of empresas || []) mapaEmpresas[e.ticker] = e;

  return (paginas || []).map((p) => ({
    ...p,
    nombre: mapaEmpresas[p.ticker]?.nombre || p.ticker,
    sector: mapaEmpresas[p.ticker]?.sector || null,
    mercado: mapaEmpresas[p.ticker]?.mercado || null
  }));
}

export default async function Comparar({ searchParams }) {
  const tickersParam = searchParams?.tickers || '';
  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4); // máximo 4 empresas

  const filas = await cargarComparacion(tickers);

  return (
    <div className="v3-container">
      <h1 style={{ marginBottom: '8px' }}>Comparador de empresas</h1>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginBottom: '20px' }}>
        Compara hasta 4 empresas por su situación estadística actual. No es recomendación de inversión.
      </p>

      <ComparadorSelector tickersIniciales={tickers} />

      {filas.length > 0 ? (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              background: '#fff',
              border: '1px solid var(--v3-border)',
              borderRadius: '8px'
            }}
          >
            <thead>
              <tr style={{ background: 'var(--v3-bg-soft)' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>
                  Métrica
                </th>
                {filas.map((f) => (
                  <th
                    key={f.ticker}
                    style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}
                  >
                    <Link
                      href={`/analisis/${f.ticker.toLowerCase()}`}
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                    >
                      {f.nombre}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Percentil 60</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.percentil ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Zona</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.zona || '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Var. 60 sesiones</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.variacion60)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Casos similares (diario)</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.casos_diario ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>% subidas diario</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.pct_subidas_diario !== null ? `${f.pct_subidas_diario}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Retorno medio diario</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(f.retorno_medio_diario)}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>Casos similares (semanal)</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.casos_semanal ?? '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)', fontWeight: 600 }}>% subidas semanal</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{f.pct_subidas_semanal !== null ? `${f.pct_subidas_semanal}%` : '—'}</td>)}
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 600 }}>Retorno medio semanal</td>
                {filas.map((f) => <td key={f.ticker} style={{ padding: '10px' }}>{formatPct(f.retorno_medio_semanal)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '20px' }}>
          Selecciona al menos una empresa para comparar.
        </p>
      )}

      <p style={{ fontSize: '11px', color: 'var(--v3-text-mute)', marginTop: '16px', lineHeight: 1.5 }}>
        Los datos mostrados son históricos y descriptivos. No constituyen recomendación de inversión.
      </p>
    </div>
  );
}
