export default function NoticiasRecientes({ noticias }) {
  if (!noticias || noticias.length === 0) {
    return (
      <div style={{ marginTop: '40px' }}>
        <h2>Noticias recientes</h2>
        <p style={{ color: '#666' }}>Aún no hay noticias recopiladas.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Noticias recientes</h2>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '12px' }}>
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
                borderBottom: '1px solid #eee',
                padding: '12px 0'
              }}
            >
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 600 }}
              >
                {n.titulo}
              </a>
              <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                {n.ticker && (
                  <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{n.ticker}</span>
                )}
                {n.fuente && <span> · {n.fuente}</span>}
                {fecha && <span> · {fecha}</span>}
              </div>
            </li>
          );
        })}
      </ul>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        Los titulares mostrados proceden de fuentes externas y se enlazan a su origen.
        Esta web no elabora ni interpreta su contenido.
        Su inclusión no implica valoración alguna sobre la empresa.
      </p>
    </div>
  );
}
