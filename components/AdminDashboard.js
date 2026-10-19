'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState('estadisticas');
  const [periodo, setPeriodo] = useState('hoy');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [regenerando, setRegenerando] = useState(null);
  const router = useRouter();

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/datos?periodo=${periodo}`);
      const json = await res.json();
      setDatos(json);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  }, [periodo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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

  if (!datos || !datos.stats) {
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
              <SeccionEstadisticas
                datos={datos}
                periodo={periodo}
                onRecargar={cargarDatos}
              />
            )}
          </>
        )}

        {seccion === 'paginas' && (
          <SeccionPaginas
            paginas={datos.paginas || []}
            onRegenerar={regenerar}
            regenerando={regenerando}
          />
        )}
        {seccion === 'comentarios' && (
          <SeccionComentarios comentarios={datos.comentarios || []} />
        )}
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
      <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
        {valor ?? 0}
      </div>
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

function SeccionEstadisticas({ datos, periodo, onRecargar }) {
  const stats = datos.stats || {};
  const listadoHoy = datos.listadoHoy || [];

  const visitasPorDia = stats.visitasPorDia || [];
  const topPaises = stats.topPaises || [];
  const topEmpresas = stats.topEmpresas || [];
  const topPaginas = stats.topPaginas || [];
  const dispositivos = stats.dispositivos || {
    movil: 0,
    escritorio: 0,
    tablet: 0,
    desconocido: 0
  };

  const maxDia = Math.max(...visitasPorDia.map((d) => d.visitas), 1);
  const maxPais = Math.max(...topPaises.map((p) => p.visitas), 1);
  const maxEmpresa = Math.max(...topEmpresas.map((e) => e.visitas), 1);
  const maxPagina = Math.max(...topPaginas.map((p) => p.visitas), 1);

  const totalDispositivos =
    (dispositivos.movil || 0) +
    (dispositivos.escritorio || 0) +
    (dispositivos.tablet || 0) +
    (dispositivos.desconocido || 0);

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
        <Tarjeta
          etiqueta="Visitantes ahora"
          valor={stats.visitantesAhora ?? 0}
          sub="últimos 5 min (únicos)"
        />
        <Tarjeta
          etiqueta="Visitas en el periodo"
          valor={stats.totalPeriodo ?? 0}
        />
        <Tarjeta
          etiqueta="Visitantes únicos"
          valor={stats.unicosPeriodo ?? 0}
        />
        <Tarjeta
          etiqueta="Totales históricos"
          valor={stats.totalVisitas ?? 0}
        />
      </div>

      {periodo === 'hoy' && (
        <>
          <h3 style={{ marginTop: '32px' }}>Detalle de visitas de hoy</h3>
          {listadoHoy.length === 0 ? (
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
                    <th>Visitante</th>
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
                        <td style={{ fontSize: '12px' }}>
                          <BotonEtiqueta
                            ipHash={v.ip_hash}
                            etiqueta={v.etiqueta}
                            color={v.color}
                            numero={v.numero}
                            onActualizado={onRecargar}
                          />
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
            {visitasPorDia.length === 0 ? (
              <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
            ) : (
              visitasPorDia.map((d) => (
                <BarraHorizontal
                  key={d.fecha}
                  etiqueta={d.fecha}
                  valor={d.visitas}
                  maximo={maxDia}
                />
              ))
            )}
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
              valor={dispositivos.movil}
              maximo={totalDispositivos}
            />
            <BarraHorizontal
              etiqueta="Escritorio"
              valor={dispositivos.escritorio}
              maximo={totalDispositivos}
            />
            <BarraHorizontal
              etiqueta="Tablet"
              valor={dispositivos.tablet}
              maximo={totalDispositivos}
            />
            <BarraHorizontal
              etiqueta="Desconocido"
              valor={dispositivos.desconocido}
              maximo={totalDispositivos}
            />
          </>
        )}
      </div>

      <h3 style={{ marginTop: '32px' }}>Empresas más visitadas</h3>
      <div className="v3-card" style={{ padding: '20px' }}>
        {topEmpresas.length === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          topEmpresas.map((e) => (
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
        {topPaises.length === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          topPaises.map((p) => (
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
        {topPaginas.length === 0 ? (
          <p style={{ color: 'var(--v3-text-soft)' }}>Sin datos todavía.</p>
        ) : (
          topPaginas.map((p) => (
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
  const [regenerandoTodas, setRegenerandoTodas] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [resultado, setResultado] = useState(null);

  async function regenerarTodas() {
    if (!paginas || paginas.length === 0) return;
    if (!confirm(`¿Regenerar las ${paginas.length} páginas? Esto puede tardar varios minutos.`)) return;

    setRegenerandoTodas(true);
    setResultado(null);

    const tickers = paginas.map((p) => p.ticker);
    const LOTE = 3;
    let okCount = 0;
    let errorCount = 0;

    for (let i = 0; i < tickers.length; i += LOTE) {
      const lote = tickers.slice(i, i + LOTE);
      setProgreso({ actual: i + lote.length, total: tickers.length });

      try {
        const res = await fetch('/api/admin/regenerar-todas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: lote })
        });
        const data = await res.json();
        if (data.resultados) {
          for (const r of data.resultados) {
            if (r.ok) okCount++;
            else errorCount++;
          }
        }
      } catch (e) {
        errorCount += lote.length;
      }
    }

    setProgreso(null);
    setRegenerandoTodas(false);
    setResultado({ ok: okCount, error: errorCount });

    if (typeof window !== 'undefined') {
      setTimeout(() => window.location.reload(), 1500);
    }
  }

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>
          Páginas generadas ({paginas.length})
        </h2>
        <button
          onClick={regenerarTodas}
          disabled={regenerandoTodas}
          className="v3-btn"
          style={{
            background: regenerandoTodas ? '#9ca3af' : '#ea580c',
            borderColor: regenerandoTodas ? '#9ca3af' : '#ea580c',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: regenerandoTodas ? 'wait' : 'pointer'
          }}
        >
          {regenerandoTodas ? 'Regenerando…' : 'Regenerar todas'}
        </button>
      </div>

      {progreso && (
        <div
          className="v3-card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: '#fff7ed',
            border: '1px solid #fdba74'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#9a3412' }}>
            Regenerando {progreso.actual} de {progreso.total}…
          </p>
        </div>
      )}

      {resultado && (
        <div
          className="v3-card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: resultado.error > 0 ? '#fef2f2' : '#f0fdf4',
            border: resultado.error > 0 ? '1px solid #fca5a5' : '1px solid #86efac'
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: resultado.error > 0 ? '#991b1b' : '#166534'
            }}
          >
            Terminado: {resultado.ok} correctas, {resultado.error} errores.
          </p>
        </div>
      )}

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

function BotonEtiqueta({ ipHash, etiqueta, color, numero, onActualizado }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(etiqueta || '');

  if (!ipHash) return <span style={{ color: 'var(--v3-text-mute)' }}>—</span>;

  async function guardar() {
    if (!texto.trim()) return;
    await fetch('/api/admin/etiquetas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_hash: ipHash, etiqueta: texto.trim() })
    });
    setEditando(false);
    if (onActualizado) onActualizado();
  }

  async function borrar() {
    if (!confirm('¿Quitar esta etiqueta?')) return;
    await fetch(`/api/admin/etiquetas?ip_hash=${encodeURIComponent(ipHash)}`, {
      method: 'DELETE'
    });
    if (onActualizado) onActualizado();
  }

  if (editando) {
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej: Yo, Cliente…"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') guardar();
            if (e.key === 'Escape') setEditando(false);
          }}
          style={{
            padding: '3px 6px',
            fontSize: '11px',
            border: '1px solid var(--v3-border-strong)',
            borderRadius: '4px',
            width: '110px'
          }}
        />
        <button
          onClick={guardar}
          style={{
            padding: '2px 6px',
            fontSize: '11px',
            background: 'var(--v3-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ✓
        </button>
      </div>
    );
  }

  if (etiqueta) {
    const esAuto = /^\d{7}$/.test(etiqueta);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: esAuto ? '#f0f2f5' : '#e3f2fd',
            color: esAuto ? 'var(--v3-text-soft)' : color || 'var(--v3-primary)'
          }}
        >
          {etiqueta}
        </span>
        <button
          onClick={() => setEditando(true)}
          title="Editar"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            color: 'var(--v3-text-mute)'
          }}
        >
          ✎
        </button>
        <button
          onClick={borrar}
          title="Quitar"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            color: 'var(--v3-text-mute)'
          }}
        >
          ✕
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setEditando(true)}
      style={{
        padding: '2px 8px',
        fontSize: '11px',
        border: '1px dashed var(--v3-border-strong)',
        borderRadius: '4px',
        background: 'none',
        color: 'var(--v3-text-mute)',
        cursor: 'pointer'
      }}
    >
      + Etiquetar
    </button>
  );
}
