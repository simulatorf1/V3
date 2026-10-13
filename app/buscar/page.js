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
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una empresa o ticker…"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '6px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Buscar
        </button>
      </form>

      {cargando && <p>Buscando…</p>}

      {buscado && !cargando && resultados.length === 0 && (
        <p style={{ color: '#666' }}>
          No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o ticker.
        </p>
      )}

      {resultados.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {resultados.map((r) => (
            <li key={r.ticker} style={{ marginBottom: '8px' }}>
              <Link
                href={`/analisis/${construirSlug(r)}`}
                style={{
                  display: 'block',
                  padding: '12px',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#111'
                }}
              >
                <strong>{r.nombre}</strong> ({r.ticker})
                {r.mercado && <span style={{ color: '#666' }}> · {r.mercado}</span>}
                {r.tipo && <span style={{ color: '#999', fontSize: '12px' }}> · {r.tipo}</span>}
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
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Buscar empresa</h1>
      <Suspense fallback={<p>Cargando buscador…</p>}>
        <BuscadorClient />
      </Suspense>
    </main>
  );
}
