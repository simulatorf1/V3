'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [seccion, setSeccion] = useState('comentarios');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/datos');
      const json = await res.json();
      setDatos(json);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
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
        {seccion === 'comentarios' && (
          <SeccionComentarios comentarios={datos.comentarios || []} />
        )}
        {seccion === 'adsense' && <SeccionAdSense />}
      </div>
    </main>
  );
}

function SeccionComentarios({ comentarios }) {
  const [items, setItems] = useState(comentarios || []);
  const [editando, setEditando] = useState(null);
  const [textoEdit, setTextoEdit] = useState('');

  useEffect(() => {
    setItems(comentarios || []);
  }, [comentarios]);

  async function borrar(id) {
    if (!confirm('¿Eliminar este comentario definitivamente?')) return;
    await fetch(`/api/comentarios/${id}`, { method: 'DELETE' });
    setItems(items.filter((c) => c.id !== id));
  }

  async function marcarSpam(id) {
    if (!confirm('¿Ocultar este comentario?')) return;
    await fetch(`/api/comentarios/${id}`, { method: 'PATCH' });
    setItems(items.filter((c) => c.id !== id));
  }

  async function banear(ipHash) {
    if (!ipHash) return;
    if (!confirm(`¿Banear la IP ${ipHash}? Se ocultarán todos sus comentarios.`)) return;
    await fetch('/api/comentarios/banear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip_hash: ipHash, motivo: 'Baneado desde admin' })
    });
    setItems(items.filter((c) => c.ip_hash !== ipHash));
  }

  async function guardarEdicion(id) {
    if (!textoEdit.trim()) return;
    await fetch(`/api/comentarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: textoEdit.trim() })
    });
    setItems(items.map((c) => (c.id === id ? { ...c, texto: textoEdit.trim() } : c)));
    setEditando(null);
    setTextoEdit('');
  }

  if (!items || items.length === 0) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Comentarios</h2>
        <p style={{ color: 'var(--v3-text-soft)' }}>
          No hay comentarios pendientes de moderación.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Comentarios ({items.length})</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
        Los comentarios se publican automáticamente. Desde aquí puedes editarlos, ocultarlos,
        eliminarlos o banear la IP.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'grid', gap: '10px' }}>
        {items.map((c) => (
          <li
            key={c.id}
            style={{
              padding: '12px 14px',
              background: '#fff',
              border: '1px solid var(--v3-border)',
              borderRadius: 'var(--v3-radius-sm)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--v3-text-mute)',
                marginBottom: '6px',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <span>
                <strong>{c.ticker}</strong> · Visitante {c.autor} · IP {c.ip_hash || '—'}
              </span>
              <span>
                {new Date(c.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
              </span>
            </div>

            {editando === c.id ? (
              <div>
                <textarea
                  value={textoEdit}
                  onChange={(e) => setTextoEdit(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '13px',
                    border: '1px solid var(--v3-border-strong)',
                    borderRadius: 'var(--v3-radius-sm)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button onClick={() => guardarEdicion(c.id)} className="v3-btn">
                    Guardar
                  </button>
                  <button onClick={() => setEditando(null)} className="v3-btn v3-btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {c.texto}
              </p>
            )}

            {editando !== c.id && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setEditando(c.id);
                    setTextoEdit(c.texto);
                  }}
                  className="v3-btn v3-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => marcarSpam(c.id)}
                  className="v3-btn v3-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  Ocultar
                </button>
                <button
                  onClick={() => borrar(c.id)}
                  className="v3-btn v3-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', color: '#b91c1c' }}
                >
                  Eliminar
                </button>
                {c.ip_hash && (
                  <button
                    onClick={() => banear(c.ip_hash)}
                    className="v3-btn v3-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px', color: '#b91c1c' }}
                  >
                    Banear IP
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
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
