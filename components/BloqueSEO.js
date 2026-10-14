import { generarTextoSEO } from '../lib/seoTexto';

export default function BloqueSEO({ empresa, analisis }) {
  const seo = generarTextoSEO({ empresa, analisis });
  if (!seo || seo.parrafos.length === 0) return null;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Sobre {empresa.nombre}</h2>

      {seo.parrafos.map((p, i) => (
        <p key={i} style={{ color: 'var(--v3-text)', lineHeight: 1.7 }}>
          {p}
        </p>
      ))}
    </section>
  );
}
