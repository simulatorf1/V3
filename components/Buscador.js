'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BOLSAS } from '../lib/bolsas';

export default function Buscador({ dark = false, bolsaActual = 'mc' }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [bolsaSeleccionada, setBolsaSeleccionada] = useState(bolsaActual);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sincronizar el estado local si la prop cambia (por navegación del servidor)
  useEffect(() => {
    setBolsaSeleccionada(bolsaActual);
  }, [bolsaActual]);

  async function buscar(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setCargando(true);
    setBuscado(true);

    try {
      const res = await fetch(
        `/api/buscar?q=${encodeURIComponent(query)}&bolsa=${bolsaSeleccionada}`
      );
      const json = await res.json();
      setResultados(json.resultados || []);
    } catch (err) {
      console.error(err);
      setResultados([]);
    }
    setCargando(false);
  }

  function cambiarBolsa(e) {
    const nueva = e.target.value;
    setBolsaSeleccionada(nueva);
    // Limpiar resultados del buscador
    setResultados([]);
    setBuscado(false);
    // Actualizar la URL para que los rankings también se filtren
    const params = new URLSearchParams(searchParams.toString());
    if (nueva === 'mc') params.delete('bolsa');
    else params.set('bolsa', nueva);
    router.push(`?${params.toString()}`);
    router.refresh();
  }

  function construirSlug(empresa) {
    const nombreLimpio = empresa.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${empresa.ticker.toLowerCase()}__${nombreLimpio}`;
  }

  const estilos = dark
    ? {
        card: { background: '#141414', border: '1px solid #222', borderRadius: '8px', padding: '12px' },
        input: { flex: '1 1 200px', minWidth: '180px', padding: '10px 12px', fontSize: '13px', border: '1px solid #333', background: '#111', color: '#f5f5f5', borderRadius: '6px', outline: 'none' },
        select: { padding: '10px 12px', fontSize: '13px', border: '1px solid #333', background: '#111', color: '#f5f5f5', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontWeight: 600 },
        boton: { padding: '10px 16px', background: '#f5f5f5', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
        linkHoy: { display: 'inline-flex', alignItems: 'center', padding: '10px 16px', background: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' },
        texto: '#a3a3a3',
        textoMute: '#666',
        listaItem: { borderBottom: '1px solid #222', padding: '8px 0' },
        link: '#f5f5f5',
        tag: { background: '#222', color: '#a3a3a3', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }
      }
    : {
        card: { marginTop: '20px' },
        input: { flex: '1 1 200px', minWidth: '180px', padding: '10px 12px', fontSize: '13px', border: '1px solid var(--v3-border-strong)', borderRadius: 'var(--v3-radius-sm)', outline: 'none' },
        select: { padding: '10px 12px', fontSize: '13px', border: '1px solid var(--v3-border-strong)', borderRadius: 'var(--v3-radius-sm)', outline: 'none', cursor: 'pointer', fontWeight: 600, background: '#fff' },
        boton: null,
        linkHoy: { display: 'inline-flex', alignItems: 'center', padding: '10px 16px', background: '#2563eb', color: '#fff', borderRadius: 'var(--v3-radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' },
        texto: 'var(--v3-text-soft)',
        textoMute: 'var(--v3-text-mute)',
        listaItem: {},
        link: 'inherit',
        tag: null
      };

  return (
    <div style={estilos.card} className={dark ? '' : 'v3-card'}>
      <form
        onSubmit={buscar}
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'stretch'
        }}
      >
        <select
          value={bolsaSeleccionada}
          onChange={cambiarBolsa}
          style={estilos.select}
          title="Bolsa"
        >
          {BOLSAS.map((b) => (
            <option key={b.codigo} value={b.codigo}>{b.nombre}</option>
          ))}
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o ticker..."
          style={estilos.input}
        />
        {dark ? (
          <button type="submit" style={estilos.boton}>Buscar</button>
        ) : (
          <button type="submit" className="v3-btn" style={{ whiteSpace: 'nowrap' }}>Buscar</button>
        )}
        <Link href="/hoy" style={estilos.linkHoy}>
          Ver resumen de hoy →
        </Link>
      </form>

      {cargando && <p style={{ color: estilos.texto, marginTop: '12px', fontSize: '12px' }}>Buscando…</p>}

      {buscado && !cargando && resultados.length === 0 && (
        <p style={{ color: estilos.texto, marginTop: '12px', fontSize: '12px' }}>
          No se han encontrado datos en {BOLSAS.find(b => b.codigo === bolsaSeleccionada)?.nombre || bolsaSeleccionada}. Prueba con otro nombre o cambia de bolsa.
        </p>
      )}

      {resultados.length > 0 && (
        <ul style={{ marginTop: '12px', listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
          {resultados.map((r) => (
            <li key={r.ticker} style={estilos.listaItem}>
              <Link
                href={`/analisis/${construirSlug(r)}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: estilos.link, fontSize: '12px' }}
              >
                <span>
                  <strong>{r.nombre}</strong>{' '}
                  <span style={{ color: estilos.textoMute }}>({r.ticker})</span>
                  {r.mercado && <span style={{ color: estilos.textoMute }}> · {r.mercado}</span>}
                </span>
                {r.tipo && (
                  dark ? <span style={estilos.tag}>{r.tipo}</span> : <span className="v3-tag">{r.tipo}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
