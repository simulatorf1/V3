import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Empresas — V3',
  description: 'Listado de empresas con análisis estadístico en V3.'
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

export default async function Empresas() {
  const { data } = await supabase
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .order('nombre', { ascending: true })
    .limit(500);

  const empresas = data || [];

  return (
    <main className="v3-container">
      <h1>Empresas</h1>
      <p style={{ color: 'var(--v3-text-soft)' }}>
        {empresas.length}{' '}
        {empresas.length === 1 ? 'empresa analizada' : 'empresas analizadas'}. La lista crece a
        medida que se consultan nuevas empresas desde el buscador.
      </p>

      {empresas.length === 0 ? (
        <p>Busca cualquier empresa desde el buscador superior para comenzar.</p>
      ) : (
        <ul className="v3-lista" style={{ marginTop: '20px' }}>
          {empresas.map((e) => (
            <li key={e.ticker}>
              <Link href={`/analisis/${slugEmpresa(e)}`}>
                <span>
                  <strong>{e.nombre}</strong>{' '}
                  <span style={{ color: 'var(--v3-text-soft)' }}>({e.ticker})</span>
                  {e.sector && (
                    <span style={{ color: 'var(--v3-text-mute)' }}> · {e.sector}</span>
                  )}
                </span>
                {e.mercado && <span className="v3-tag">{e.mercado}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
