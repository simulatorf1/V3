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
  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Sectores</h2>

      {!sectores || sectores.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>Aún no hay sectores disponibles.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px'
          }}
        >
          {sectores.map((s) => (
            <Link
              key={s.sector}
              href={`/sectores/${slugSector(s.sector)}`}
              style={{
                display: 'block',
                padding: '14px 16px',
                border: '1px solid var(--v3-border)',
                borderRadius: 'var(--v3-radius-sm)',
                color: 'var(--v3-text)',
                textDecoration: 'none'
              }}
            >
              <div style={{ fontWeight: 700 }}>{s.sector}</div>
              <div style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
                {s.empresas} {s.empresas === 1 ? 'empresa' : 'empresas'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
