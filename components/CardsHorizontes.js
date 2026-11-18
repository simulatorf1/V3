// components/CardsHorizontes.js
const cardStyle = {
  padding: '14px 16px',
  border: '1px solid var(--v3-border)',
  borderRadius: 'var(--v3-radius-sm, 8px)',
  background: '#fff'
};

const tituloStyle = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  color: 'var(--v3-text-mute)',
  marginBottom: '8px'
};

function CardHorizonte({ titulo, proyeccion, horizonte }) {
  if (!proyeccion || proyeccion.total === 0) {
    return (
      <div style={cardStyle}>
        <div style={tituloStyle}>{titulo}</div>
        <div style={{ fontSize: '12.5px', color: 'var(--v3-text-soft)' }}>
          Sin casos históricos suficientes.
        </div>
      </div>
    );
  }

  const retorno = proyeccion.retornoMedio;
  const retornoTxt =
    retorno !== undefined && retorno !== null
      ? `${retorno >= 0 ? '+' : ''}${retorno}%`
      : '—';

  return (
    <div style={cardStyle}>
      <div style={tituloStyle}>{titulo}</div>
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'baseline',
          marginBottom: '6px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ fontSize: '26px', fontWeight: 800 }}>{proyeccion.pctSubidas}%</div>
        <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)' }}>
          de subidas en {proyeccion.total} casos
        </div>
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--v3-text-soft)' }}>
        Retorno medio: <strong>{retornoTxt}</strong> a {horizonte}.
      </div>
    </div>
  );
}

export default function CardsHorizontes({
  proyeccionDiaria,
  proyeccionSemanal,
  percentil,
  zona,
  smiActual
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}
    >
      <CardHorizonte
        titulo="Corto plazo (10 sesiones)"
        proyeccion={proyeccionDiaria}
        horizonte="10 sesiones"
      />
      <CardHorizonte
        titulo="Largo plazo (10 semanas)"
        proyeccion={proyeccionSemanal}
        horizonte="10 semanas"
      />
      <div style={cardStyle}>
        <div style={tituloStyle}>Situación actual</div>
        <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
          {smiActual !== null && smiActual !== undefined ? Math.round(smiActual) : '—'}
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--v3-text-soft)' }}>
          Indicador Equaty · Percentil {percentil ?? '—'} · {zona || 'zona intermedia'}
        </div>
      </div>
    </div>
  );
}
