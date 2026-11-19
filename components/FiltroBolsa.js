'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BOLSAS } from '../lib/bolsas';

export default function FiltroBolsa({ valorActual = 'mc', dark = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function cambiar(e) {
    const nueva = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (nueva === 'mc') params.delete('bolsa');
    else params.set('bolsa', nueva);
    router.push(`?${params.toString()}`);
  }

  const estilos = dark
    ? { label: '#a3a3a3', selectBg: '#141414', selectBorder: '#333', selectColor: '#f5f5f5' }
    : { label: 'var(--v3-text-mute)', selectBg: '#fff', selectBorder: 'var(--v3-border)', selectColor: 'var(--v3-text)' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: estilos.label, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Bolsa
      </label>
      <select
        value={valorActual}
        onChange={cambiar}
        style={{
          padding: '8px 12px',
          fontSize: '13px',
          fontWeight: 600,
          border: `1px solid ${estilos.selectBorder}`,
          borderRadius: '6px',
          background: estilos.selectBg,
          color: estilos.selectColor,
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {BOLSAS.map((b) => (
          <option key={b.codigo} value={b.codigo}>{b.nombre}</option>
        ))}
      </select>
    </div>
  );
}
