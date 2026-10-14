export default function NoticiasRecientes({ noticias }) {
  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Noticias recientes</h2>

      {!noticias || noticias.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>Aún no hay noticias recopiladas.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {noticias.slice(0, 10).map((n, i) => {
            const fecha = n.fecha_publicacion
              ? new Date(n.fecha_publicacion).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
              : '';
            return (
              <li
                key={i}
                style={{
                  borderBottom: '1px solid var(--v3-border)',
                  padding: '12px 0'
                }}
              >
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: 'var(--v3-text)', fontWeight: 600 }}
                >
                  {n.titulo}
                </a>
                <div style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '4px' }}>
                  {n.ticker && (
                    <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                      {n.ticker}
                    </span>
                  )}
                  {n.fuente && <span> · {n.fuente}</span>}
                  {fecha && <span> · {fecha}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '20px' }}>
        Los titulares mostrados proceden de fuentes externas y se enlazan a su origen. Esta web no
        elabora ni interpreta su contenido. Su inclusión no implica valoración alguna sobre la
        empresa.
      </p>
    </section>
  );
}
