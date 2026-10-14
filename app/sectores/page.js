import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sectores — V3',
  description: 'Sectores con empresas analizadas en V3.'
};

function slugSector(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function Sectores() {
  const { data } = await supabase
    .from('empresas')
    .select('sector')
    .not('sector', 'is', null);

  const conteo = {};
  for (const e of data || []) {
    if (!e.sector) continue;
    conteo[e.sector] = (conteo[e.sector] || 0) + 1;
  }
  const sectores = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, n]) => ({ sector, n }));

  return (
    <main className="v3-container">
      <h1>Sectores</h1>

      {sectores.length === 0 ? (
        <p>No hay sectores disponibles todavía.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px',
            marginTop: '20px'
          }}
        >
          {sectores.map((s) => (
            <Link
              key={s.sector}
              href={`/sectores/${slugSector(s.sector)}`}
              className="v3-card"
              style={{ color: 'var(--v3-text)' }}
            >
              <div style={{ fontWeight: 700 }}>{s.sector}</div>
              <div style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '4px' }}>
                {s.n} {s.n === 1 ? 'empresa' : 'empresas'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
