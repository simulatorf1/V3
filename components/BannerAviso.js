'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BannerAviso() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cerrado = localStorage.getItem('equaty_aviso_cookies');
    if (cerrado === '1') return;
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  function cerrar() {
    localStorage.setItem('equaty_aviso_cookies', '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        maxWidth: '640px',
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: '16px 18px',
        zIndex: 9999,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: '13.5px',
        lineHeight: 1.5,
        color: '#111'
      }}
    >
      <div style={{ flex: 1, minWidth: '220px' }}>
        Esta web usa cookies propias (para el consenso de la comunidad) y de Google Analytics
        (para medir visitas). Puedes informarte o desactivar Analytics en{' '}
        <Link href="/cookies" style={{ color: '#2563eb', fontWeight: 600 }}>
          Política de cookies
        </Link>
        .
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link
          href="/cookies"
          style={{
            padding: '8px 14px',
            background: '#fff',
            color: '#111',
            border: '1px solid #ccc',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          Ver cookies
        </Link>
        <button
          onClick={cerrar}
          style={{
            padding: '8px 14px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
