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
    <main className="v3-container" style={{ maxWidth: '420px' }}>
      <h1>Panel de administración</h1>
      <p style={{ color: 'var(--v3-text-soft)' }}>Introduce la contraseña para acceder.</p>

      <form
        onSubmit={enviar}
        className="v3-card"
        style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          style={{
            padding: '10px 12px',
            fontSize: '15px',
            border: '1px solid var(--v3-border-strong)',
            borderRadius: 'var(--v3-radius-sm)',
            outline: 'none'
          }}
        />
        <button type="submit" className="v3-btn" disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
        {error && (
          <p style={{ color: 'var(--v3-negative)', margin: 0, fontSize: '14px' }}>{error}</p>
        )}
      </form>
    </main>
  );
}
