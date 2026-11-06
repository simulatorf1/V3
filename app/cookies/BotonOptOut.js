'use client';

import { useState } from 'react';

export default function BotonOptOut() {
  const [desactivado, setDesactivado] = useState(false);

  function desactivar() {
    document.cookie = 'ga-disable-G-LVV061GCPF=true; path=/; max-age=31536000; SameSite=Lax';
    setDesactivado(true);
  }

  function reactivar() {
    document.cookie = 'ga-disable-G-LVV061GCPF=; path=/; max-age=0';
    setDesactivado(false);
  }

  return (
    <div style={{ margin: '16px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {!desactivado ? (
        <button
          onClick={desactivar}
          style={{
            padding: '10px 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Desactivar Google Analytics
        </button>
      ) : (
        <>
          <span style={{ alignSelf: 'center', color: '#166534', fontWeight: 600, fontSize: '14px' }}>
            ✓ Google Analytics desactivado en este navegador
          </span>
          <button
            onClick={reactivar}
            style={{
              padding: '10px 18px',
              background: '#fff',
              color: '#111',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reactivar
          </button>
        </>
      )}
    </div>
  );
}
