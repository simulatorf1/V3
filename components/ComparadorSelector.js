'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ComparadorSelector({ tickersIniciales = [] }) {
  const [tickers, setTickers] = useState(tickersIniciales.join(','));
  const router = useRouter();

  function aplicar() {
    const limpios = tickers
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 4);
    router.push(`/comparar?tickers=${limpios.join(',')}`);
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        value={tickers}
        onChange={(e) => setTickers(e.target.value)}
        placeholder="Tickers separados por coma: TEF, SAN, ITX"
        style={{
          flex: 1,
          minWidth: '240px',
          padding: '10px 12px',
          fontSize: '14px',
          border: '1px solid var(--v3-border)',
          borderRadius: '6px'
        }}
      />
      <button
        onClick={aplicar}
        style={{
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 600,
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Comparar
      </button>
    </div>
  );
}
