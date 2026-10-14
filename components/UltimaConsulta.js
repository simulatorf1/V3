'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      className="v3-card"
      style={{
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        background: '#eef4ff',
        borderColor: '#c7d9ff'
      }}
    >
      <span style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
        Tu última consulta:
      </span>
      <Link
        href={`/analisis/${ticker.toLowerCase()}`}
        style={{ fontWeight: 700, fontSize: '15px' }}
      >
        {ticker} →
      </Link>
    </div>
  );
}
