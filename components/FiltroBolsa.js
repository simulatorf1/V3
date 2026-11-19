'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BOLSAS } from '../lib/bolsas';

export default function FiltroBolsa({ valorActual = 'mc' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function cambiar(e) {
    const nueva = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (nueva === 'mc') {
      params.delete('bolsa'); // Madrid es el default, no lo ponemos en la URL
    } else {
      params.set('bolsa', nueva);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--v3-text-mute)' }}>
        Bolsa:
      </label>
      <select
        value={valorActual}
        onChange={cambiar}
        style={{
          padding: '6px 10px',
          fontSize: '13px',
          border: '1px solid var(--v3-border)',
          borderRadius: '6px',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        {BOLSAS.map((b) => (
          <option key={b.codigo} value={b.codigo}>
            {b.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
