import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { notFound } from 'next/navigation';

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

function normalizar(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function SectorDetalle({ params }) {
  const slug = params.slug;

  const { data: todas } = await supabase
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .not('sector', 'is', null);

  const empresas = (todas || []).filter((e) => normalizar(e.sector) === slug);
  if (empresas.length === 0) {
    notFound();
  }

  const sector = empresas[0].sector;

  return (
    <main style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Inicio &gt; Sectores &gt; {sector}
      </p>
      <h1>Sector {sector}</h1>
      <p style={{ color: '#666' }}>
        {empresas.length} {empresas.length === 1 ? 'empresa' : 'empresas'} en este sector.
      </p>

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
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
