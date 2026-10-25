import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function situacionDesdeCategoria(cat) {
  if (cat === 'A') return 'parte alta';
  if (cat === 'C') return 'parte baja';
  return 'parte intermedia';
}

function fechaLegible(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

async function cargarCambios() {
  try {
    const { data: cambios } = await supabaseAdmin
      .from('cambios_movimiento')
      .select('ticker, movimiento_anterior, movimiento_nuevo, detectado_at')
      .order('detectado_at', { ascending: false })
      .limit(500);

    if (!cambios || cambios.length === 0) return [];

    const tickers = [...new Set(cambios.map((c) => c.ticker))];
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
        c.movimiento_nuevo === 'venta' ? 'A' : c.movimiento_nuevo === 'compra' ? 'C' : 'B',
      detectado_at: c.detectado_at
    }));
  } catch (e) {
    console.error('[cambios] Error:', e.message);
    return [];
  }
}

export default async function PaginaCambios() {
  const cambios = await cargarCambios();

  return (
    <main className="v3-container">
      <h1>Historial de cambios de zona</h1>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
        Registro histórico de todos los cambios de zona de las empresas. Datos históricos
        descriptivos. No predictivos. No constituyen recomendación de inversión.
      </p>
      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px' }}>
        {cambios.length} cambios registrados.
      </p>

      {cambios.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>Sin cambios registrados todavía.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '12px 0 0 0',
            display: 'grid',
            gap: '6px'
          }}
        >
          {cambios.map((c, i) => {
            const slug = `${c.ticker.toLowerCase()}__${(c.nombre || c.ticker)
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')}`;
            return (
              <li key={`${c.ticker}-${i}`}>
                <Link
                  href={`/analisis/${slug}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: '#fff',
                    border: '1px solid var(--v3-border)',
                    borderRadius: 'var(--v3-radius-sm)',
                    textDecoration: 'none',
                    color: 'var(--v3-text)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                    <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px' }}>
                      {c.ticker}
                      {c.sector && ` · ${c.sector}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--v3-text-soft)' }}>
                    <div>
                      {situacionDesdeCategoria(c.categoriaAnterior)} → {situacionDesdeCategoria(c.categoriaNueva)}
                    </div>
                    <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px' }}>
                      {fechaLegible(c.detectado_at)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
