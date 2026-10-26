import Link from 'next/link';

function construirSlug(cambio) {
  const nombreLimpio = (cambio.nombre || cambio.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cambio.ticker.toLowerCase()}__${nombreLimpio}`;
}

function etiquetaPendiente(cat) {
  if (cat === 'C') return { texto: 'pendiente negativa', clase: 'v3-zona-baja' };
  if (cat === 'A') return { texto: 'pendiente positiva', clase: 'v3-zona-alta' };
  return { texto: 'sin pendiente', clase: 'v3-zona-intermedia' };
}

function Bloque({ titulo, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3
        style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--v3-text-mute)',
          margin: '0 0 8px 0'
        }}
      >
        {titulo}
      </h3>
      <div style={{ display: 'grid', gap: '6px' }}>
        {items.map((c) => {
          const ant = etiquetaPendiente(c.categoriaAnterior);
          const nue = etiquetaPendiente(c.categoriaNueva);
          return (
            <Link
              key={c.ticker}
              href={`/analisis/${construirSlug(c)}`}
              style={{
                display: 'block',
                padding: '10px 12px',
                background: '#fff',
                border: '1px solid var(--v3-border)',
                borderRadius: 'var(--v3-radius-sm)',
                textDecoration: 'none',
                color: 'var(--v3-text)'
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {c.nombre}
              </div>
              <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px', marginTop: '2px' }}>
                {c.ticker}
                {c.sector && ` · ${c.sector}`}
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px' }}>
                <span className={`v3-zona-tag ${ant.clase}`}>{ant.texto}</span>
                <span style={{ margin: '0 4px', color: 'var(--v3-text-mute)' }}>→</span>
                <span className={`v3-zona-tag ${nue.clase}`}>{nue.texto}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ListaCambiosZona({ cambios }) {
  if (!cambios || cambios.length === 0) {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Cambios de pendiente de hoy</h2>
        <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
          Ninguna empresa ha cambiado de pendiente en las últimas 24 horas.
        </p>
      </section>
    );
  }

  const aPositiva = cambios.filter(
    (c) => c.categoriaAnterior === 'C' && c.categoriaNueva === 'A'
  );
  const aNegativa = cambios.filter(
    (c) => c.categoriaAnterior === 'A' && c.categoriaNueva === 'C'
  );
  const otros = cambios.filter(
    (c) =>
      !(c.categoriaAnterior === 'C' && c.categoriaNueva === 'A') &&
      !(c.categoriaAnterior === 'A' && c.categoriaNueva === 'C')
  );

  const hayGrupos = aPositiva.length > 0 || aNegativa.length > 0;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Cambios de pendiente de hoy</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Empresas cuyo indicador Equaty ha cambiado de pendiente en las últimas 24 horas. Dato
        descriptivo.
      </p>

      {hayGrupos ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '12px'
          }}
        >
          <Bloque titulo="Pendiente pasa a positiva" items={aPositiva} />
          <Bloque titulo="Pendiente pasa a negativa" items={aNegativa} />
        </div>
      ) : (
        <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
          {otros.map((c) => {
            const ant = etiquetaPendiente(c.categoriaAnterior);
            const nue = etiquetaPendiente(c.categoriaNueva);
            return (
              <Link
                key={c.ticker}
                href={`/analisis/${construirSlug(c)}`}
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  background: '#fff',
                  border: '1px solid var(--v3-border)',
                  borderRadius: 'var(--v3-radius-sm)',
                  textDecoration: 'none',
                  color: 'var(--v3-text)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{c.nombre}</div>
                <div style={{ color: 'var(--v3-text-mute)', fontSize: '11px' }}>
                  {c.ticker}
                  {c.sector && ` · ${c.sector}`}
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px' }}>
                  <span className={`v3-zona-tag ${ant.clase}`}>{ant.texto}</span>
                  <span style={{ margin: '0 4px', color: 'var(--v3-text-mute)' }}>→</span>
                  <span className={`v3-zona-tag ${nue.clase}`}>{nue.texto}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <Link
          href="/cambios"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: 'var(--v3-radius-sm)',
            border: '1px solid var(--v3-border-strong)',
            background: '#fff',
            color: 'var(--v3-text)',
            textDecoration: 'none'
          }}
        >
          Ver historial completo
        </Link>
      </div>
    </section>
  );
}
