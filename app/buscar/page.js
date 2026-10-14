'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function construirSlug(empresa) {
  const nombreLimpio = empresa.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${empresa.ticker.toLowerCase()}__${nombreLimpio}`;
}

function BuscadorClient() {
  const searchParams = useSearchParams();
  const qInicial = searchParams.get('q') || '';

  const [query, setQuery] = useState(qInicial);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    if (qInicial) {
      hacerBusqueda(qInicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInicial]);

  async function hacerBusqueda(texto) {
    if (!texto || !texto.trim()) return;
    setCargando(true);
    setBuscado(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(texto)}`);
      const json = await res.json();
      setResultados(json.resultados || []);
    } catch (err) {
      console.error(err);
      setResultados([]);
    }
    setCargando(false);
  }

  function onSubmit(e) {
    e.preventDefault();
    hacerBusqueda(query);
  }

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="v3-card"
        style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una empresa o ticker…"
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '10px 12px',
            fontSize: '15px',
            border: '1px solid var(--v3-border-strong)',
            borderRadius: 'var(--v3-radius-sm)',
            outline: 'none'
          }}
        />
        <button type="submit" className="v3-btn">
          Buscar
        </button>
      </form>

      {cargando && <p>Buscando…</p>}

      {buscado && !cargando && resultados.length === 0 && (
        <p style={{ color: 'var(--v3-text-soft)' }}>
          No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o ticker.
        </p>
      )}

      {resultados.length > 0 && (
        <ul className="v3-lista">
          {resultados.map((r) => (
            <li key={r.ticker}>
              <Link href={`/analisis/${construirSlug(r)}`}>
                <span>
                  <strong>{r.nombre}</strong>{' '}
                  <span style={{ color: 'var(--v3-text-soft)' }}>({r.ticker})</span>
                  {r.mercado && (
                    <span style={{ color: 'var(--v3-text-mute)' }}> · {r.mercado}</span>
                  )}
                </span>
                {r.tipo && <span className="v3-tag">{r.tipo}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PaginaBuscar() {
  return (
    <main className="v3-container">
      <h1>Buscar empresa</h1>
      <Suspense fallback={<p>Cargando buscador…</p>}>
        <BuscadorClient />
      </Suspense>
    </main>
  );
}
