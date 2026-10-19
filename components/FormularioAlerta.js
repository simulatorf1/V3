'use client';

import { useState } from 'react';

export default function FormularioAlerta({ empresa, variante = 'pagina' }) {
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

  const esSidebar = variante === 'sidebar';

  if (estado === 'enviado') {
    return (
      <div
        style={{
          padding: esSidebar ? '16px' : '20px',
          borderLeft: '4px solid var(--v3-positive)',
          background: '#f0fdf4',
          borderRadius: 'var(--v3-radius-sm)',
          marginTop: esSidebar ? '0' : '30px'
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--v3-positive)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          ✓ Casi listo
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--v3-text)', lineHeight: 1.5 }}>
          Revisa tu correo y pulsa el enlace de confirmación. Hasta que no lo hagas, no recibirás
          alertas.
        </p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes v3-parpadeo-gratis {
          0%, 100% {
            background-color: #dc2626;
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            background-color: #991b1b;
            box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
          }
        }
        .v3-gratis-badge {
          animation: v3-parpadeo-gratis 1.2s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '2px solid #f97316',
          borderRadius: 'var(--v3-radius)',
          padding: esSidebar ? '16px' : '20px',
          marginTop: esSidebar ? '0' : '30px',
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              fontSize: esSidebar ? '14px' : '16px',
              fontWeight: 800,
              color: '#9a3412'
            }}
          >
            {esSidebar ? 'Alertas gratis' : 'Alertas por email'}
          </div>
          <span
            className="v3-gratis-badge"
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.5px'
            }}
          >
            GRATIS
          </span>
        </div>

        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: esSidebar ? '12.5px' : '14px',
            color: '#7c2d12',
            lineHeight: 1.5
          }}
        >
          {esSidebar
            ? `Avisamos cuando ${empresa.nombre} cambie de zona de lectura. Sin registro.`
            : `Avísame cuando el indicador de ${empresa.nombre} cambie de zona de lectura (alta → baja o baja → alta). Sin registro, sin coste.`}
        </p>

        <form onSubmit={enviar}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '2px solid #fdba74',
              borderRadius: 'var(--v3-radius-sm)',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '8px'
            }}
            disabled={estado === 'enviando'}
          />
          <button
            type="submit"
            disabled={estado === 'enviando'}
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              background: estado === 'enviando' ? '#9ca3af' : '#ea580c',
              border: 'none',
              borderRadius: 'var(--v3-radius-sm)',
              cursor: estado === 'enviando' ? 'wait' : 'pointer'
            }}
          >
            {estado === 'enviando' ? 'Enviando…' : 'Quiero recibirlas gratis'}
          </button>

          <label
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              marginTop: '10px',
              fontSize: '11.5px',
              color: '#7c2d12',
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
              Acepto recibir alertas por email. Puedo darme de baja cuando quiera. He leído la{' '}
              <a href="/privacidad" style={{ color: '#9a3412', fontWeight: 600 }}>
                Política de Privacidad
              </a>
              .
            </span>
          </label>

          {error && (
            <p style={{ color: '#b91c1c', fontSize: '12px', marginTop: '8px' }}>{error}</p>
          )}
        </form>

        <p
          style={{
            color: '#9a3412',
            fontSize: '11px',
            marginTop: '10px',
            marginBottom: 0,
            lineHeight: 1.4
          }}
        >
          Recibirás únicamente alertas sobre esta empresa. Puedes darte de baja en cualquier
          momento con un clic.
        </p>
      </div>
    </>
  );
}
