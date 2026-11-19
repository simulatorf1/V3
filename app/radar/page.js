import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import RadarFiltros from '../../components/RadarFiltros';

export const revalidate = 3600;

function formatPct(v) {
  if (v === null || v === undefined) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

async function cargarRadar(filtros) {
  let query = supabaseAdmin
    .from('paginas')
    .select('ticker, percentil, zona, variacion60, pct_subidas_diario, pct_subidas_semanal, retorno_medio_diario, retorno_medio_semanal, casos_diario, casos_semanal');

  if (filtros.percentilMin !== null) query = query.gte('percentil', filtros.percentilMin);
  if (filtros.percentilMax !== null) query = query.lte('percentil', filtros.percentilMax);
  if (filtros.zona) query = query.eq('zona', filtros.zona);
  if (filtros.pctSubidasMin !== null) query = query.gte('pct_subidas_diario', filtros.pctSubidasMin);

  const { data: paginas } = await query.limit(100);

  if (!paginas || paginas.length === 0) return [];

  const tickers = paginas.map((p) => p.ticker);
  const { data: empresas } = await supabaseAdmin
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .in('ticker', tickers);

  const mapaEmpresas = {};
  for (const e of empresas || []) mapaEmpresas[e.ticker] = e;

  return paginas.map((p) => ({
    ...p,
    nombre: mapaEmpresas[p.ticker]?.nombre || p.ticker,
    sector: mapaEmpresas[p.ticker]?.sector || null
  }));
}

export default async function Radar({ searchParams }) {
  const filtros = {
    percentilMin: searchParams?.percentilMin ? parseInt(searchParams.percentilMin, 10) : null,
    percentilMax: searchParams?.percentilMax ? parseInt(searchParams.percentilMax, 10) : null,
    zona: searchParams?.zona || null,
    pctSubidasMin: searchParams?.pctSubidasMin ? parseInt(searchParams.pctSubidasMin, 10) : null
  };

  const resultados = await cargarRadar(filtros);

  return (
    <div className="v3-container">
      <h1 style={{ marginBottom: '8px' }}>Radar de coincidencias</h1>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginBottom: '20px' }}>
        Filtra empresas por su situación estadística actual. No es recomendación de inversión.
      </p>

      <RadarFiltros filtrosIniciales={filtros} />

      <div style={{ marginTop: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
          {resultados.length} empresas encontradas
        </div>
        {resultados.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                background: '#fff',
                border: '1px solid var(--v3-border)'
              }}
            >
              <thead>
                <tr style={{ background: 'var(--v3-bg-soft)' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Empresa</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Percentil</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Zona</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Var 60</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>% subidas diario</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Retorno diario</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>% subidas semanal</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid var(--v3-border)' }}>Retorno semanal</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.ticker}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>
                      <Link href={`/analisis/${r.ticker.toLowerCase()}`} style={{ color: '#2563eb' }}>
                        {r.nombre}
                      </Link>
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{r.percentil ?? '—'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{r.zona || '—'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(r.variacion60)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{r.pct_subidas_diario !== null ? `${r.pct_subidas_diario}%` : '—'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(r.retorno_medio_diario)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{r.pct_subidas_semanal !== null ? `${r.pct_subidas_semanal}%` : '—'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--v3-border)' }}>{formatPct(r.retorno_medio_semanal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--v3-text-soft)' }}>No hay empresas que cumplan los filtros.</p>
        )}
      </div>
    </div>
  );
}
