'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RadarFiltros({ filtrosIniciales }) {
  const [percentilMin, setPercentilMin] = useState(filtrosIniciales.percentilMin ?? '');
  const [percentilMax, setPercentilMax] = useState(filtrosIniciales.percentilMax ?? '');
  const [zona, setZona] = useState(filtrosIniciales.zona ?? '');
  const [pctSubidasMin, setPctSubidasMin] = useState(filtrosIniciales.pctSubidasMin ?? '');
  const router = useRouter();

  function aplicar() {
    const params = new URLSearchParams();
    if (percentilMin !== '') params.set('percentilMin', percentilMin);
    if (percentilMax !== '') params.set('percentilMax', percentilMax);
    if (zona) params.set('zona', zona);
    if (pctSubidasMin !== '') params.set('pctSubidasMin', pctSubidasMin);
    router.push(`/radar?${params.toString()}`);
  }

  const inputStyle = {
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid var(--v3-border)',
    borderRadius: '6px',
    width: '100%'
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: 'var(--v3-bg-soft)',
        borderRadius: '8px',
        border: '1px solid var(--v3-border)'
      }}
    >
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v3-text-mute)', display: 'block', marginBottom: '4px' }}>
          Percentil mínimo
        </label>
        <input type="number" min="0" max="100" value={percentilMin} onChange={(e) => setPercentilMin(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v3-text-mute)', display: 'block', marginBottom: '4px' }}>
          Percentil máximo
        </label>
        <input type="number" min="0" max="100" value={percentilMax} onChange={(e) => setPercentilMax(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v3-text-mute)', display: 'block', marginBottom: '4px' }}>
          Zona
        </label>
        <select value={zona} onChange={(e) => setZona(e.target.value)} style={inputStyle}>
          <option value="">Cualquiera</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v3-text-mute)', display: 'block', marginBottom: '4px' }}>
          % subidas mínimo (diario)
        </label>
        <input type="number" min="0" max="100" value={pctSubidasMin} onChange={(e) => setPctSubidasMin(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button
          onClick={aplicar}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
