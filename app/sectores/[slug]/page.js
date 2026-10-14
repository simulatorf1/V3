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

export async function generateMetadata({ params }) {
  const slug = params.slug;
  return {
    title: `Sector ${slug} — V3`,
    description: `Empresas del sector ${slug} con análisis estadístico en V3.`
  };
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
    <main className="v3-container">
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
        Inicio &gt; Sectores &gt; {sector}
      </p>
      <h1>Sector {sector}</h1>
      <p style={{ color: 'var(--v3-text-soft)' }}>
        {empresas.length} {empresas.length === 1 ? 'empresa' : 'empresas'} en este sector.
      </p>

      <ul className="v3-lista" style={{ marginTop: '20px' }}>
        {empresas.map((e) => (
          <li key={e.ticker}>
            <Link href={`/analisis/${slugEmpresa(e)}`}>
              <span>
                <strong>{e.nombre}</strong>{' '}
                <span style={{ color: 'var(--v3-text-soft)' }}>({e.ticker})</span>
              </span>
              {e.mercado && <span className="v3-tag">{e.mercado}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
