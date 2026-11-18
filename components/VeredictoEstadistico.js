// components/VeredictoEstadistico.js
function renderizarNegritas(texto) {
  if (!texto) return null;
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return <span key={i}>{p}</span>;
  });
}

export default function VeredictoEstadistico({ veredicto }) {
  if (!veredicto) return null;
  const texto = veredicto.parrafoCompleto || veredicto.texto;

  return (
    <div
      style={{
        marginTop: '16px',
        marginBottom: '16px',
        padding: '16px 20px',
        borderRadius: 'var(--v3-radius-sm, 8px)',
        border: `2px solid ${veredicto.color}`,
        background: `${veredicto.color}0D`,
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: veredicto.color,
          marginTop: '4px',
          boxShadow: `0 0 0 4px ${veredicto.color}22`
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--v3-text)', marginBottom: '6px' }}>
          {veredicto.titulo}
        </div>
        <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--v3-text)' }}>
          {renderizarNegritas(texto)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', marginTop: '8px' }}>
          Basado en comportamiento histórico descriptivo. No es una recomendación de inversión.
        </div>
      </div>
    </div>
  );
}
