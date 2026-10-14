import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Posiciones de referencia — V3',
  description: 'Backtesting público de las posiciones abiertas por el algoritmo.'
};

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
    <main className="v3-container">
      <h1>Posiciones de referencia (backtesting)</h1>
      <p style={{ color: 'var(--v3-text-soft)' }}>
        Simulación pública de las posiciones abiertas por el algoritmo en su registro histórico.
        No son operaciones reales.
      </p>

      {posiciones.length === 0 ? (
        <p>Actualmente no hay posiciones abiertas según las reglas del algoritmo.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table className="v3-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Fecha entrada</th>
                <th>Precio entrada</th>
                <th>Precio actual</th>
                <th>Variación</th>
              </tr>
            </thead>
            <tbody>
              {posiciones.map((p) => (
                <tr key={p.ticker}>
                  <td>
                    <Link href={`/analisis/${slugEmpresa(p)}`}>
                      {p.nombre} ({p.ticker})
                    </Link>
                  </td>
                  <td>{p.fecha}</td>
                  <td>{p.precioEntrada?.toFixed(2)}</td>
                  <td>{p.precioActual?.toFixed(2)}</td>
                  <td className={p.variacion >= 0 ? 'v3-pos' : 'v3-neg'}>
                    {p.variacion !== null
                      ? `${p.variacion >= 0 ? '+' : ''}${p.variacion.toFixed(2)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="v3-aviso-mute" style={{ marginTop: '20px' }}>
        Las posiciones son registros automáticos que genera el algoritmo según sus reglas
        predefinidas. No representan operaciones reales realizadas por esta web ni constituyen una
        sugerencia de compra o venta. El rendimiento pasado no garantiza resultados futuros.
      </p>
    </main>
  );
}
