export default function Loading() {
  return (
    <div
      className="v3-container"
      style={{
        maxWidth: '700px',
        textAlign: 'center',
        paddingTop: '80px'
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Generando análisis…</h1>
      <p
        style={{
          color: 'var(--v3-text-soft)',
          fontSize: '15px',
          lineHeight: 1.6
        }}
      >
        Estamos descargando los datos más recientes y calculando el análisis. Esto tarda unos 3
        segundos.
      </p>
      <div
        style={{
          marginTop: '24px',
          width: '40px',
          height: '40px',
          margin: '24px auto 0',
          border: '4px solid var(--v3-border)',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
