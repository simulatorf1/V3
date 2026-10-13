import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Noticias — V3',
  description: 'Últimos titulares recopilados por el sistema.'
};
export default async function Noticias() {
  const { data } = await supabase
    .from('noticias')
    .select('ticker, titulo, fuente, url, fecha_publicacion')
    .order('fecha_publicacion', { ascending: false })
    .limit(50);

  const noticias = data || [];

  return (
    <main style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Noticias</h1>
      <p style={{ color: '#666' }}>
        Últimos titulares recopilados por el sistema.
      </p>

      {noticias.length === 0 ? (
        <p>No hay noticias recopiladas todavía. Consulta alguna empresa para que el sistema
        empiece a agregar titulares.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          {noticias.map((n, i) => {
            const fecha = n.fecha_publicacion
              ? new Date(n.fecha_publicacion).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
              : '';
            return (
              <li key={i} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 600 }}
                >
                  {n.titulo}
                </a>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                  {n.ticker && <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{n.ticker}</span>}
                  {n.fuente && <span> · {n.fuente}</span>}
                  {fecha && <span> · {fecha}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
        Los titulares mostrados proceden de fuentes externas y se enlazan a su origen.
        Esta web no elabora ni interpreta su contenido. Su inclusión no implica valoración
        alguna sobre la empresa.
      </p>
    </main>
  );
}
