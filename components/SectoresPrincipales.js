import Link from 'next/link';

function slugSector(sector) {
  return sector
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SectoresPrincipales({ sectores }) {
  if (!sectores || sectores.length === 0) {
    return (
      <div style={{ marginTop: '40px' }}>
        <h2>Sectores</h2>
        <p style={{ color: '#666' }}>Aún no hay sectores disponibles.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Sectores</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '10px',
          marginTop: '12px'
        }}
      >
        {sectores.map((s) => (
          <Link
            key={s.sector}
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
            <div style={{ fontWeight: 'bold' }}>{s.sector}</div>
            <div style={{ color: '#666', fontSize: '13px' }}>
              {s.empresas} {s.empresas === 1 ? 'empresa' : 'empresas'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
