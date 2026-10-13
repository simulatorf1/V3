import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

function slugSector(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
export const metadata = {
  title: 'Sectores — V3',
  description: 'Sectores con empresas analizadas en V3.'
};
export default async function Sectores() {
  const { data } = await supabase.from('empresas').select('sector').not('sector', 'is', null);

  const conteo = {};
  for (const e of data || []) {
    if (!e.sector) continue;
    conteo[e.sector] = (conteo[e.sector] || 0) + 1;
  }
  const sectores = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, n]) => ({ sector, n }));

  return (
    <main style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Sectores</h1>
      {sectores.length === 0 ? (
        <p>No hay sectores disponibles todavía.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          {sectores.map((s) => (
            <li key={s.sector} style={{ marginBottom: '8px' }}>
              <Link
                href={`/sectores/${slugSector(s.sector)}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#111'
                }}
              >
                <strong>{s.sector}</strong>{' '}
                <span style={{ color: '#666' }}>({s.n} empresas)</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
