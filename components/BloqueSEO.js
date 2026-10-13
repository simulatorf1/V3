import { generarTextoSEO } from '../lib/seoTexto';

export default function BloqueSEO({ empresa, analisis }) {
  const seo = generarTextoSEO({ empresa, analisis });
  if (!seo || seo.parrafos.length === 0) return null;

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Sobre {empresa.nombre}</h2>

      {seo.parrafos.map((p, i) => (
        <p key={i} style={{ lineHeight: '1.7', color: '#333' }}>
          {p}
        </p>
      ))}
    </div>
  );
}
