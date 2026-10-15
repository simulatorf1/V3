'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState('estadisticas');
  const [periodo, setPeriodo] = useState('hoy');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [regenerando, setRegenerando] = useState(null);
  const router = useRouter();

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/datos?periodo=${periodo}`);
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

  if (cargando && !datos) {
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

  const periodos = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mes' },
    { key: 'anio', label: 'Año' }
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={cargarDatos} className="v3-btn v3-btn-secondary">
            Refrescar
          </button>
          <button onClick={logout} className="v3-btn v3-btn-secondary">
            Cerrar sesión
          </button>
        </div>
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
        {seccion === 'estadisticas' && (
          <>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '20px'
              }}
            >
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className={periodo === p.key ? 'v3-btn' : 'v3-btn v3-btn-secondary'}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {cargando ? (
              <p>Cargando datos del periodo…</p>
            ) : (
              <SeccionEstadisticas datos={datos} periodo={periodo} />
            )}
          </>
        )}

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

function Tarjeta({ etiqueta, valor, sub }) {
  return (
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
      {sub && <div style={{ fontSize: '12px', color: 'var(--v3-text-soft)' }}>{sub}</div>}
    </div>
  );
}

function BarraHorizontal({ etiqueta, valor, maximo, color }) {
  const ancho = maximo > 0 ? (valor / maximo) * 100 : 0;
  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          marginBottom: '2px'
        }}
      >
        <span>{etiqueta}</span>
        <span style={{ color: 'var(--v3-text-soft)' }}>{valor}</span>
      </div>
      <div
        style={{
          background: 'var(--v3-bg-subtle)',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${ancho}%`,
            height: '100%',
            background: color || 'var(--v3-primary)'
          }}
        />
      </div>
    </div>
  );
}

function fechaMadrid(fecha) {
  return new Date(fecha).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function SeccionEstadisticas({ datos, periodo }) {
  const { stats, listadoHoy } = datos;

  const maxDia = Math.max(...(stats.visitasPorDia || []).map((d) => d.visitas), 1);
  const maxPais = Math.max(...(stats.topPaises || []).map((p) => p.visitas), 1);
  const maxEmpresa = Math.max(...(stats.topEmpresas || []).map((e) => e.visitas), 1);
  const maxPagina = Math.max(...(stats.topPaginas || []).map((p) => p.visitas), 1);

  const totalDispositivos =
    (stats.dispositivos?.movil || 0) +
    (stats.dispositivos?.escritorio || 0) +
    (stats.dispositivos?.tablet || 0) +
    (stats.dispositivos?.desconocido || 0);

  const etiquetaPeriodo = {
    hoy: 'hoy',
    semana: 'últimos 7 días',
    mes: 'últimos 30 días',
    anio: 'últimos 12 meses'
  }[periodo];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Resumen del periodo ({etiquetaPeriodo})</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}
      >
        <Tarjeta etiqueta="Visitantes ahora" valor={stats.visitantesAhora} sub="últimos 5 min" />
        <Tarjeta etiqueta="Visitas en el periodo" valor={stats.totalPeriodo} />
        <Tarjeta etiqueta="Visitantes únicos" valor={stats.unicosPeriodo} />
        <Tarjeta etiqueta="Totales históricos" valor={stats.totalVisitas} />
      </div>

      {periodo === 'hoy' && (
        <>
          <h3 style={{ marginTop: '32px' }}>Detalle de visitas de hoy</h3>
          {!listadoHoy || listadoHoy.length === 0 ? (
            <p style={{ color: 'var(--v3-text-soft)' }}>
              Aún no hay visitas registradas hoy.
            </p>
          ) : (
            <div
              style={{
                border: '1px solid var(--v3-border)',
                borderRadius: 'var(--v3-radius-sm)',
                maxHeight: '500px',
                overflowY: 'auto',
                overflowX: 'auto'
              }}
            >
              <table className="v3-table" style={{ margin: 0 }}>
                <thead
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--v3-bg-soft)',
                    zIndex: 1
                  }}
                >
                  <tr>
                    <th>Hora</th>
                    <th>Ruta</th>
                    <th>Ticker</th>
                    <th>País</th>
                    <th>IP (hash)</th>
                    <th>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {listadoHoy.map((v, i) => {
                    const ua = (v.user_agent || '').toLowerCase();
                    let disp = 'Escritorio';
                    if (!ua) disp = '—';
                    else if (/ipad|tablet/.test(ua)) disp = 'Tablet';
                    else if (/mobile|android|iphone|ipod/.test(ua)) disp = 'Móvil';
                    return (
                      <tr key={i}>
                        <td style={{ fontSize: '12px' }}>{fechaMadrid(v.fecha)}</td>
                        <td style={{ fontSize: '12px' }}>{v.ruta}</td>
                        <td style={{ fontSize: '12px' }}>{v.ticker || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{v.pais || '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--v3-text-mute)' }}>
                          {v.ip_hash || '—'}
                        </td>
                        <td style={{ fontSize: '12px' }}>{disp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {periodo !== 'hoy' && (
        <>
          <h3 style={{ marginTop: '32px' }}>
            {periodo === 'anio' ? 'Visitas por mes' : 'Visitas por día'}
          </h3>
          <div className="v3-card" style={{ padding: '20px' }}>
            {stats.visitasPorDia.map((d) => (
              <BarraHorizontal
                key={d.fecha}
                etiqueta={d.fecha}
                valor={d.visitas}
                maximo={maxDia}
              />
            ))}
          </div>
        </>
      )}

      <h3 style={{ marginTop: '32px' }}>Dispositivos</h3>
      <div className="v3-card" style={{ padding: '20px' }}>
        {totalDispositivos === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          <>
            <BarraHorizontal
              etiqueta="Móvil"
              valor={stats.dispositivos.movil}
              maximo={totalDispositivos}
            />
            <BarraHorizontal
              etiqueta="Escritorio"
              valor={stats.dispositivos.escritorio}
              maximo={totalDispositivos}
            />
            <BarraHorizontal
              etiqueta="Tablet"
              valor={stats.dispositivos.tablet}
              maximo={totalDispositivos}
            />
            <BarraHorizontal
              etiqueta="Desconocido"
              valor={stats.dispositivos.desconocido}
              maximo={totalDispositivos}
            />
          </>
        )}
      </div>

      <h3 style={{ marginTop: '32px' }}>Empresas más visitadas</h3>
      <div className="v3-card" style={{ padding: '20px' }}>
        {stats.topEmpresas.length === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          stats.topEmpresas.map((e) => (
            <BarraHorizontal
              key={e.ticker}
              etiqueta={e.ticker}
              valor={e.visitas}
              maximo={maxEmpresa}
            />
          ))
        )}
      </div>

      <h3 style={{ marginTop: '32px' }}>Países</h3>
      <div className="v3-card" style={{ padding: '20px' }}>
        {stats.topPaises.length === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          stats.topPaises.map((p) => (
            <BarraHorizontal
              key={p.pais}
              etiqueta={p.pais}
              valor={p.visitas}
              maximo={maxPais}
            />
          ))
        )}
      </div>

      <h3 style={{ marginTop: '32px' }}>Páginas más visitadas</h3>
      <div className="v3-card" style={{ padding: '20px' }}>
        {stats.topPaginas.length === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          stats.topPaginas.map((p) => (
            <BarraHorizontal
              key={p.ruta}
              etiqueta={p.ruta}
              valor={p.visitas}
              maximo={maxPagina}
            />
          ))
        )}
      </div>
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
                  {new Date(p.actualizado_at).toLocaleString('es-ES', {
                    timeZone: 'Europe/Madrid'
                  })}
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
