'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function construirSlug(ticker) {
  return ticker.toLowerCase();
}

export default function UltimaConsulta() {
  const [ticker, setTicker] = useState(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )v3_ultima_empresa=([^;]*)/);
    if (match) {
      const valor = decodeURIComponent(match[1]);
      if (valor) setTicker(valor);
    }
  }, []);

  if (!ticker) return null;

  return (
    <div
      style={{
        background: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}
    >
      <span style={{ color: '#1565c0', fontSize: '14px' }}>
        <strong>Tu última consulta:</strong>
      </span>
      <Link
        href={`/analisis/${construirSlug(ticker)}`}
        style={{
          color: '#1565c0',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontSize: '15px'
        }}
      >
        {ticker} →
      </Link>
    </div>
  );
}
