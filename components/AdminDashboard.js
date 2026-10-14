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
      <main style={{ padding: '40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1>Panel de administración</h1>
        <p>Cargando…</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1>Panel de administración</h1>
        <p>No se han podido cargar los datos.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Panel de administración</h1>
        <button
          onClick={logout}
          style={{
            padding: '8px 14px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <nav style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
        {[
          { key: 'estadisticas', label: 'Estadísticas' },
          { key: 'paginas', label: 'Páginas generadas' },
          { key: 'comentarios', label: 'Comentarios' },
          { key: 'adsense', label: 'AdSense' }
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSeccion(s.key)}
            style={{
              padding: '8px 14px',
              background: seccion === s.key ? '#0070f3' : '#fff',
              color: seccion === s.key ? '#fff' : '#333',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
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
  return (
    <div>
      <h2>Estadísticas generales</h2>
      <ul>
        <li><strong>Visitas totales:</strong> {stats.totalVisitas}</li>
        <li><strong>Visitas últimos 7 días:</strong> {stats.visitas7d}</li>
        <li><strong>Empresas en la base de datos:</strong> {stats.totalEmpresas}</li>
        <li><strong>Páginas generadas:</strong> {stats.totalPaginas}</li>
      </ul>

      <h3 style={{ marginTop: '30px' }}>Páginas más visitadas (últimos 7 días)</h3>
      {stats.topPaginas.length === 0 ? (
        <p style={{ color: '#666' }}>Aún no hay visitas registradas.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Ruta</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Visitas</th>
            </tr>
          </thead>
          <tbody>
            {stats.topPaginas.map((p, i) => (
              <tr key={i}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.ruta}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.visitas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: '30px' }}>Países</h3>
      {stats.topPaises.length === 0 ? (
        <p style={{ color: '#666' }}>Sin datos de país todavía.</p>
      ) : (
        <ul>
          {stats.topPaises.map((p, i) => (
            <li key={i}><strong>{p.pais || 'Desconocido'}:</strong> {p.visitas}</li>
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
        <h2>Páginas generadas</h2>
        <p style={{ color: '#666' }}>Aún no hay páginas generadas.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Páginas generadas ({paginas.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Ticker</th>
            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Slug</th>
            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Actualizado</th>
            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginas.map((p) => (
            <tr key={p.ticker}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <Link href={`/analisis/${p.slug}`} style={{ color: '#0070f3' }}>
                  {p.ticker}
                </Link>
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>{p.slug}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                {new Date(p.actualizado_at).toLocaleString('es-ES')}
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <button
                  onClick={() => onRegenerar(p.ticker)}
                  disabled={regenerando === p.ticker}
                  style={{
                    padding: '4px 10px',
                    fontSize: '13px',
                    border: '1px solid #ccc',
                    background: '#fff',
                    borderRadius: '4px',
                    cursor: regenerando === p.ticker ? 'wait' : 'pointer'
                  }}
                >
                  {regenerando === p.ticker ? 'Regenerando…' : 'Regenerar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeccionComentarios({ comentarios }) {
  return (
    <div>
      <h2>Comentarios</h2>
      <p style={{ color: '#666' }}>
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
      <h2>AdSense</h2>
      <p style={{ color: '#666' }}>
        La configuración de Google AdSense estará disponible en el Paso 26.
      </p>
    </div>
  );
}
