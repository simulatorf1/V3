'use client';

import { useEffect, useState } from 'react';
import { useWatchlist } from './WatchlistContext';

export default function WatchlistBoton({ ticker, nombre }) {
  const { tiene, agregar, quitar, listo } = useWatchlist();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!ticker) return null;
  if (!montado) return null;
  if (!listo) return null;

  const enLista = tiene(ticker);

  function toggle() {
    if (enLista) quitar(ticker);
    else agregar(ticker);
  }

  return (
    <button
      onClick={toggle}
      className={enLista ? '' : 'v3-btn-favorito'}
      title={enLista ? 'Quitar de mis favoritas' : 'Añadir a mis favoritas'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: 600,
        borderRadius: 'var(--v3-radius-sm)',
        border: '1px solid #2563eb',
        background: enLista ? '#2563eb' : '#fff',
        color: enLista ? '#fff' : '#2563eb',
        cursor: 'pointer'
      }}
    >
      {enLista ? '★ En mis favoritas' : '☆ Añadir a mis favoritas'}
    </button>
  );
}
