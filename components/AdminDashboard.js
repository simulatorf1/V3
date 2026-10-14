'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState('estadisticas');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [regenerando, setRegenerando] = useState(null);
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/datos');
      const json = await res.json();
      setDatos(json);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  }

  async function regenerar(ticker) {
    if (!confirm(`¿Regenerar el análisis de ${ticker}?`)) return;
    setRegenerando(ticker);
    try {
      await fetch('/api/admin/regenerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      });
      await cargarDatos();
    } catch (e) {
      console.error(e);
    }
    setRegenerando(null);
  }

  if (cargando) {
    return (
      <main className="v3-container">
        <h1>Panel de administración</h1>
        <p>Cargando…</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="v3-container">
        <h1>Panel de administración</h1>
        <p>No se han podido cargar los datos.</p>
      </main>
    );
  }

  const tabs = [
    { key: 'estadisticas', label: 'Estadísticas' },
    { key: 'paginas', label: 'Páginas generadas' },
    { key: 'comentarios', label: 'Comentarios' },
    { key: 'adsense', label: 'AdSense' }
  ];

  return (
    <main className="v3-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <h1 style={{ margin: 0 }}>Panel de administración</h1>
        <button onClick={logout} className="v3-btn v3-btn-secondary">
          Cerrar sesión
        </button>
      </div>

      <nav
        style={{
          marginTop: '24px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--v3-border)',
          paddingBottom: '12px'
        }}
      >
        {tabs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSeccion(s.key)}
            className={seccion === s.key ? 'v3-btn' : 'v3-btn v3-btn-secondary'}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: '24px' }}>
        {seccion === 'estadisticas' && <SeccionEstadisticas datos={datos} />}
        {seccion === 'paginas' && (
          <SeccionPaginas
            paginas={datos.paginas}
            onRegenerar={regenerar}
            regenerando={regenerando}
          />
        )}
        {seccion === 'comentarios' && <SeccionComentarios comentarios={datos.comentarios} />}
        {seccion === 'adsense' && <SeccionAdSense />}
      </div>
    </main>
  );
}

function SeccionEstadisticas({ datos }) {
  const { stats } = datos;

  const tarjeta = (etiqueta, valor) => (
    <div className="v3-card" style={{ padding: '16px' }}>
      <div
        style={{
          color: 'var(--v3-text-mute)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600
        }}
      >
        {etiqueta}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{valor}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Estadísticas generales</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        {tarjeta('Visitas totales', stats.totalVisitas)}
        {tarjeta('Visitas últimos 7 días', stats.visitas7d)}
        {tarjeta('Empresas en BD', stats.totalEmpresas)}
        {tarjeta('Páginas generadas', stats.totalPaginas)}
      </div>

      <h3 style={{ marginTop: '32px' }}>Páginas más visitadas (últimos 7 días)</h3>
      {stats.topPaginas.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>Aún no hay visitas registradas.</p>
      ) : (
        <table className="v3-table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Visitas</th>
            </tr>
          </thead>
          <tbody>
            {stats.topPaginas.map((p, i) => (
              <tr key={i}>
                <td>{p.ruta}</td>
                <td>{p.visitas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '32px' }}>Países</h3>
      {stats.topPaises.length === 0 ? (
        <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos de país todavía.</p>
      ) : (
        <ul>
          {stats.topPaises.map((p, i) => (
            <li key={i}>
              <strong>{p.pais || 'Desconocido'}:</strong> {p.visitas}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeccionPaginas({ paginas, onRegenerar, regenerando }) {
  if (!paginas || paginas.length === 0) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Páginas generadas</h2>
        <p style={{ color: 'var(--v3-text-soft)' }}>Aún no hay páginas generadas.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Páginas generadas ({paginas.length})</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="v3-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Slug</th>
              <th>Actualizado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginas.map((p) => (
              <tr key={p.ticker}>
                <td>
                  <Link href={`/analisis/${p.slug}`}>{p.ticker}</Link>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--v3-text-soft)' }}>{p.slug}</td>
                <td style={{ fontSize: '12px' }}>
                  {new Date(p.actualizado_at).toLocaleString('es-ES')}
                </td>
                <td>
                  <button
                    onClick={() => onRegenerar(p.ticker)}
                    disabled={regenerando === p.ticker}
                    className="v3-btn v3-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '13px' }}
                  >
                    {regenerando === p.ticker ? 'Regenerando…' : 'Regenerar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeccionComentarios({ comentarios }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Comentarios</h2>
      <p style={{ color: 'var(--v3-text-soft)' }}>
        La moderación de comentarios estará disponible cuando se active el módulo de comentarios.
      </p>
      {comentarios && comentarios.length > 0 && (
        <p>Comentarios pendientes: {comentarios.length}</p>
      )}
    </div>
  );
}

function SeccionAdSense() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>AdSense</h2>
      <p style={{ color: 'var(--v3-text-soft)' }}>
        La configuración de Google AdSense estará disponible en el Paso 26.
      </p>
    </div>
  );
}
