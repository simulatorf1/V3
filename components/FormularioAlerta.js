'use client';

import { useState } from 'react';

export default function FormularioAlerta({ empresa }) {
  const [email, setEmail] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [estado, setEstado] = useState('inicial');
  const [error, setError] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Escribe tu email.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('El email no es válido.');
      return;
    }
    if (!acepta) {
      setError('Debes aceptar recibir las alertas.');
      return;
    }

    setEstado('enviando');

    try {
      const res = await fetch('/api/alertas/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          ticker: empresa.ticker
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo completar la suscripción.');
        setEstado('inicial');
        return;
      }

      setEstado('enviado');
    } catch (e) {
      setError('Error de conexión. Inténtalo de nuevo.');
      setEstado('inicial');
    }
  }

  if (estado === 'enviado') {
    return (
      <section className="v3-seccion">
        <h2 className="v3-seccion-titulo">Alertas por email</h2>
        <div
          className="v3-card"
          style={{
            padding: '20px',
            borderLeft: '4px solid var(--v3-positive)',
            background: '#f0fdf4'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--v3-text)' }}>
            <strong>Revisa tu correo.</strong> Te hemos enviado un email para confirmar la
            suscripción. Hasta que no hagas clic en el enlace, no recibirás alertas.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Alertas por email</h2>

      <div className="v3-card" style={{ padding: '20px' }}>
        <p style={{ marginTop: 0, fontSize: '14px', color: 'var(--v3-text-soft)' }}>
          Avísame cuando el indicador de <strong>{empresa.nombre}</strong> cambie de movimiento
          registrado (de compra a venta o de venta a compra).
        </p>

        <form onSubmit={enviar} style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--v3-border-strong)',
                borderRadius: 'var(--v3-radius-sm)',
                outline: 'none'
              }}
              disabled={estado === 'enviando'}
            />
            <button
              type="submit"
              className="v3-btn"
              disabled={estado === 'enviando'}
            >
              {estado === 'enviando' ? 'Enviando…' : 'Suscribirme'}
            </button>
          </div>

          <label
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              marginTop: '12px',
              fontSize: '13px',
              color: 'var(--v3-text-soft)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              style={{ marginTop: '2px' }}
              disabled={estado === 'enviando'}
            />
            <span>
              Acepto recibir alertas por email sobre esta empresa. Puedo darme de baja en
              cualquier momento. He leído la{' '}
              <a href="/privacidad" style={{ color: 'var(--v3-primary)' }}>
                Política de Privacidad
              </a>
              .
            </span>
          </label>

          {error && (
            <p style={{ color: 'var(--v3-negative)', fontSize: '13px', marginTop: '10px' }}>
              {error}
            </p>
          )}
        </form>

        <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '14px' }}>
          Recibirás únicamente alertas del algoritmo sobre esta empresa. Puedes darte de baja en
          cualquier momento.
        </p>
      </div>
    </section>
  );
}
