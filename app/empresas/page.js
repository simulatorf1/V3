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
export const metadata = {
  title: 'Empresas — V3',
  description: 'Listado de empresas con análisis estadístico en V3.'
};
export default async function Empresas() {
  const { data } = await supabase
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .order('nombre', { ascending: true })
    .limit(500);

  const empresas = data || [];

  return (
    <main style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Empresas</h1>
      <p style={{ color: '#666' }}>
        {empresas.length} {empresas.length === 1 ? 'empresa analizada' : 'empresas analizadas'}.
        La lista crece a medida que se consultan nuevas empresas desde el buscador.
      </p>

      {empresas.length === 0 ? (
        <p>Busca cualquier empresa desde el buscador superior para comenzar.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          {empresas.map((e) => (
            <li key={e.ticker} style={{ marginBottom: '8px' }}>
              <Link
                href={`/analisis/${slugEmpresa(e)}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#111'
                }}
              >
                <strong>{e.nombre}</strong> <span style={{ color: '#666' }}>({e.ticker})</span>
                {e.sector && <span style={{ color: '#999', fontSize: '13px' }}> · {e.sector}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
