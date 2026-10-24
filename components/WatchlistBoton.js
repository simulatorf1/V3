'use client';

import { useWatchlist } from './WatchlistContext';

export default function WatchlistBoton({ ticker, nombre }) {
  const { tiene, agregar, quitar, listo } = useWatchlist();

  if (!ticker) return null;
  if (!listo) return null;

  const enLista = tiene(ticker);

  function toggle() {
    if (enLista) quitar(ticker);
    else agregar(ticker);
  }

  return (
    <button
      onClick={toggle}
      title={enLista ? 'Quitar de mi lista' : 'Añadir a mi lista'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: 600,
        borderRadius: 'var(--v3-radius-sm)',
        border: enLista ? '1px solid #2563eb' : '1px solid var(--v3-border-strong)',
        background: enLista ? '#2563eb' : '#fff',
        color: enLista ? '#fff' : 'var(--v3-text)',
        cursor: 'pointer'
      }}
    >
      {enLista ? '★ En mi lista' : '☆ Añadir a mi lista'}
    </button>
  );
}
