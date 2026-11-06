'use client';

import { useState } from 'react';

export const metadata = {
  title: 'Política de Cookies — Equaty',
  description: 'Información sobre las cookies que utiliza Equaty y cómo desactivarlas.'
};

export default function Cookies() {
  const [desactivado, setDesactivado] = useState(false);

  function desactivarAnalytics() {
    document.cookie = 'ga-disable-G-LVV061GCPF=true; path=/; max-age=31536000; SameSite=Lax';
    setDesactivado(true);
  }

  function reactivarAnalytics() {
    document.cookie = 'ga-disable-G-LVV061GCPF=; path=/; max-age=0';
    setDesactivado(false);
  }

  return (
    <main className="v3-container" style={{ maxWidth: '820px', paddingTop: '40px', paddingBottom: '60px' }}>
      <h1>Política de Cookies</h1>

      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
        Última actualización: {new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}
      </p>

      <p>
        Este sitio utiliza un número reducido de cookies, todas ellas con finalidad funcional o
        estadística anónima. No utilizamos cookies publicitarias ni de perfilado.
      </p>

      <h2>Cookies propias</h2>
      <ul>
        <li>
          <strong>v3_cookie_id:</strong> identificador anónimo para que el usuario no repita su voto
          en el consenso de la comunidad. Duración: 1 año.
        </li>
        <li>
          <strong>v3_voto_[ticker]:</strong> almacena el voto realizado por el usuario sobre una
          empresa concreta. Duración: 1 año.
        </li>
        <li>
          <strong>v3_ultima_empresa:</strong> guarda el último ticker consultado para mostrarlo en
          la página principal. Duración: 1 año.
        </li>
      </ul>

      <h2>Cookies de terceros</h2>
      <ul>
        <li>
          <strong>Google Analytics:</strong> utiliza las cookies <code>_ga</code> y{' '}
          <code>_ga_G-LVV061GCPF</code> para medir de forma agregada las visitas y el uso del sitio.
          Duración: 2 años. Más información en{' '}
          <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
            policies.google.com
          </a>.
        </li>
      </ul>

      <h2>Desactivar Google Analytics</h2>
      <p>
        Si no deseas que Google Analytics registre tu visita, puedes desactivarlo con el siguiente
        botón. Esta acción instala una cookie de exclusión (<code>ga-disable-G-LVV061GCPF</code>) que
        impide que Analytics envíe datos desde este navegador.
      </p>

      <div style={{ margin: '16px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {!desactivado ? (
          <button
            onClick={desactivarAnalytics}
            style={{
              padding: '10px 18px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Desactivar Google Analytics
          </button>
        ) : (
          <>
            <span style={{ alignSelf: 'center', color: '#166534', fontWeight: 600, fontSize: '14px' }}>
              ✓ Google Analytics desactivado en este navegador
            </span>
            <button
              onClick={reactivarAnalytics}
              style={{
                padding: '10px 18px',
                background: '#fff',
                color: '#111',
                border: '1px solid #ccc',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reactivar
            </button>
          </>
        )}
      </div>

      <h2>Cookies propias del consenso de la comunidad</h2>
      <p>
        Las cookies <code>v3_cookie_id</code> y <code>v3_voto_[ticker]</code> son estrictamente
        necesarias para que el sistema de votos funcione y no se puedan repetir votos. No requieren
        consentimiento previo, pero puedes eliminarlas desde tu navegador.
      </p>

      <h2>Cómo desactivar las cookies desde el navegador</h2>
      <p>
        Puedes bloquear o eliminar las cookies desde la configuración de tu navegador. Aquí tienes
        las instrucciones de los más habituales:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>
      <p>
        El bloqueo de las cookies funcionales no impide el acceso al contenido, pero puede afectar al
        funcionamiento del consenso de la comunidad.
      </p>

      <h2>Más información</h2>
      <p>
        Para cualquier duda sobre esta política de cookies, puedes contactar con nosotros a través de
        la página de <a href="/contacto">contacto</a>.
      </p>
    </main>
  );
}
