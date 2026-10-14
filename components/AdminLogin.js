'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setCargando(false);
  }

  return (
    <main style={{ padding: '60px 24px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px' }}>Panel de administración</h1>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Introduce la contraseña para acceder.
      </p>

      <form onSubmit={enviar} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          style={{
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '6px'
          }}
        />
        <button
          type="submit"
          disabled={cargando}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: cargando ? 'wait' : 'pointer'
          }}
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#c62828', marginTop: '12px', fontSize: '14px' }}>{error}</p>
      )}
    </main>
  );
}
