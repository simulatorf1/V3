import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

function slugEmpresa(e) {
  const nombreLimpio = (e.nombre || e.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${e.ticker.toLowerCase()}__${nombreLimpio}`;
}

export default async function Posiciones() {
  // Empresas cuya última señal histórica sigue abierta
  const { data: paginas } = await supabase
    .from('paginas')
    .select('ticker, datos');

  const posiciones = [];
  for (const p of paginas || []) {
    if (!p.datos) continue;
    if (!p.datos.posicionAbierta) continue;
    const ultima = (p.datos.senales || []).slice(-1)[0];
    if (!ultima || ultima.tipo !== 'compra') continue;

    const { data: emp } = await supabase
      .from('empresas')
      .select('ticker, nombre, sector')
      .eq('ticker', p.ticker)
      .maybeSingle();

    posiciones.push({
      ticker: p.ticker,
      nombre: emp?.nombre || p.ticker,
      sector: emp?.sector || null,
      fecha: ultima.fecha,
      precioEntrada: ultima.precio,
      precioActual: p.datos.precioActual,
      variacion: ultima.precio
        ? ((p.datos.precioActual - ultima.precio) / ultima.precio) * 100
        : null
    });
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Posiciones de referencia (backtesting)</h1>
      <p style={{ color: '#666' }}>
        Simulación pública de las posiciones abiertas por el algoritmo en su registro histórico.
        No son operaciones reales.
      </p>

      {posiciones.length === 0 ? (
        <p>Actualmente no hay posiciones abiertas según las reglas del algoritmo.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Empresa</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Fecha entrada</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Precio entrada</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Precio actual</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Variación</th>
            </tr>
          </thead>
          <tbody>
            {posiciones.map((p) => (
              <tr key={p.ticker}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <Link href={`/analisis/${slugEmpresa(p)}`} style={{ color: '#0070f3', textDecoration: 'none' }}>
                    {p.nombre} ({p.ticker})
                  </Link>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.fecha}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.precioEntrada?.toFixed(2)}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.precioActual?.toFixed(2)}</td>
                <td style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  color: p.variacion >= 0 ? '#2e7d32' : '#c62828'
                }}>
                  {p.variacion !== null ? `${p.variacion >= 0 ? '+' : ''}${p.variacion.toFixed(2)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        Las posiciones son registros automáticos que genera el algoritmo según sus reglas predefinidas.
        No representan operaciones reales realizadas por esta web ni constituyen una sugerencia de
        compra o venta. El rendimiento pasado no garantiza resultados futuros.
      </p>
    </main>
  );
}
