'use client';

import { useState } from 'react';

export default function FormularioAlerta({ empresa, variante = 'pagina' }) {
  const [email, setEmail] = useState('');
  const [zonaObjetivo, setZonaObjetivo] = useState('baja');
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
      setError('Debes aceptar recibir las actualizaciones estadísticas.');
      return;
    }

    setEstado('enviando');

    try {
      const res = await fetch('/api/alertas/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          ticker: empresa.ticker,
          zonaObjetivo
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
          borderLeft: '4px solid #2563eb',
          background: '#eff6ff',
          borderRadius: 'var(--v3-radius-sm)',
          marginTop: esSidebar ? '0' : '16px'
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#1e40af',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          ✓ Casi listo
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--v3-text)', lineHeight: 1.5 }}>
          Revisa tu correo y pulsa el enlace de confirmación. Hasta que no lo hagas, no recibirás
          notificaciones.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '2px solid #3b82f6',
        borderRadius: 'var(--v3-radius)',
        padding: esSidebar ? '16px' : '20px',
        marginTop: esSidebar ? '0' : '16px'
      }}
    >
      <div
        style={{
          fontSize: esSidebar ? '14px' : '16px',
          fontWeight: 800,
          color: '#1e3a8a',
          marginBottom: '8px'
        }}
      >
        {esSidebar ? 'Avisos por email' : 'Avisos por email cuando cambie de pendiente'}
      </div>

      <p
        style={{
          margin: '0 0 12px 0',
          fontSize: esSidebar ? '12.5px' : '14px',
          color: '#1e40af',
          lineHeight: 1.5
        }}
      >
        Elige de qué pendiente quieres que te avisemos cuando {empresa.nombre} cambie. Solo el
        dato, sin interpretación.
      </p>

      <form onSubmit={enviar}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setZonaObjetivo('baja')}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--v3-radius-sm)',
              border:
                zonaObjetivo === 'baja'
                  ? '2px solid #2563eb'
                  : '1px solid var(--v3-border-strong)',
              background: zonaObjetivo === 'baja' ? '#2563eb' : '#fff',
              color: zonaObjetivo === 'baja' ? '#fff' : 'var(--v3-text)',
              cursor: 'pointer'
            }}
          >
            Salga de pendiente negativa
          </button>
          <button
            type="button"
            onClick={() => setZonaObjetivo('alta')}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--v3-radius-sm)',
              border:
                zonaObjetivo === 'alta'
                  ? '2px solid #2563eb'
                  : '1px solid var(--v3-border-strong)',
              background: zonaObjetivo === 'alta' ? '#2563eb' : '#fff',
              color: zonaObjetivo === 'alta' ? '#fff' : 'var(--v3-text)',
              cursor: 'pointer'
            }}
          >
            Salga de pendiente positiva
          </button>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            border: '2px solid #93c5fd',
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
            background: estado === 'enviando' ? '#9ca3af' : '#2563eb',
            border: 'none',
            borderRadius: 'var(--v3-radius-sm)',
            cursor: estado === 'enviando' ? 'wait' : 'pointer'
          }}
        >
          {estado === 'enviando' ? 'Enviando…' : 'Quiero recibir avisos'}
        </button>

        <label
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            marginTop: '10px',
            fontSize: '11.5px',
            color: '#1e40af',
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
            Acepto recibir actualizaciones estadísticas por email. Puedo darme de baja cuando
            quiera. He leído la{' '}
            <a href="/privacidad" style={{ color: '#1e3a8a', fontWeight: 600 }}>
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
          color: '#1e40af',
          fontSize: '11px',
          marginTop: '10px',
          marginBottom: 0,
          lineHeight: 1.4
        }}
      >
        Recibirás únicamente notificaciones informativas sobre cambios de pendiente en esta
        empresa. Puedes darte de baja en cualquier momento con un clic. Estas notificaciones no
        constituyen una señal ni recomendación de inversión.
      </p>
    </div>
  );
}
