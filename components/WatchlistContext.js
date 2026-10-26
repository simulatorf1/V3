'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const WatchlistContext = createContext({
  lista: [],
  agregar: () => {},
  quitar: () => {},
  tiene: () => false,
  listo: false,
  estados: {},
  ultimaVisita: null,
  actualizarEstados: () => {},
  marcarVisita: () => {},
  getEstadoAnterior: () => null
});

const STORAGE_KEY = 'equaty_watchlist_v1';
const ESTADO_KEY = 'equaty_watchlist_estado_v2';

export function WatchlistProvider({ children }) {
  const [lista, setLista] = useState([]);
  const [estados, setEstados] = useState({});
  const [ultimaVisita, setUltimaVisita] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLista(parsed.map((t) => String(t).toUpperCase()));
        }
      }
      const rawEstado = window.localStorage.getItem(ESTADO_KEY);
      if (rawEstado) {
        const parsedEstado = JSON.parse(rawEstado);
        if (parsedEstado && typeof parsedEstado === 'object') {
          if (parsedEstado.estados && typeof parsedEstado.estados === 'object') {
            setEstados(parsedEstado.estados);
          } else if (parsedEstado.zonas && typeof parsedEstado.zonas === 'object') {
            // Migración de v1 (solo zonas) a v2 (estados completos)
            const migrados = {};
            for (const [ticker, zona] of Object.entries(parsedEstado.zonas)) {
              migrados[ticker] = { zona, variacion60: null, indicador: null, percentil: null };
            }
            setEstados(migrados);
          }
          if (parsedEstado.ultimaVisita) {
            setUltimaVisita(parsedEstado.ultimaVisita);
          }
        }
      }
    } catch (e) {}
    setListo(true);
  }, []);

  function persistirLista(nuevaLista) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
    } catch (e) {}
  }

  function persistirEstado(nuevosEstados, nuevaUltimaVisita) {
    try {
      window.localStorage.setItem(
        ESTADO_KEY,
        JSON.stringify({
          estados: nuevosEstados,
          ultimaVisita: nuevaUltimaVisita
        })
      );
    } catch (e) {}
  }

  function agregar(ticker) {
    if (!ticker) return;
    const t = String(ticker).toUpperCase();
    setLista((prev) => {
      if (prev.includes(t)) return prev;
      const nueva = [...prev, t];
      persistirLista(nueva);
      return nueva;
    });
  }

  function quitar(ticker) {
    if (!ticker) return;
    const t = String(ticker).toUpperCase();
    setLista((prev) => {
      const nueva = prev.filter((x) => x !== t);
      persistirLista(nueva);
      return nueva;
    });
    setEstados((prev) => {
      const nuevos = { ...prev };
      delete nuevos[t];
      persistirEstado(nuevos, ultimaVisita);
      return nuevos;
    });
  }

  function tiene(ticker) {
    if (!ticker) return false;
    return lista.includes(String(ticker).toUpperCase());
  }

  function actualizarEstados(nuevosEstados) {
    if (!nuevosEstados || typeof nuevosEstados !== 'object') return;
    setEstados((prev) => {
      const combinado = { ...prev, ...nuevosEstados };
      persistirEstado(combinado, ultimaVisita);
      return combinado;
    });
  }

  function marcarVisita() {
    const ahora = new Date().toISOString();
    setUltimaVisita(ahora);
    persistirEstado(estados, ahora);
  }

  function getEstadoAnterior(ticker) {
    if (!ticker) return null;
    return estados[String(ticker).toUpperCase()] || null;
  }

  return (
    <WatchlistContext.Provider
      value={{
        lista,
        agregar,
        quitar,
        tiene,
        listo,
        estados,
        ultimaVisita,
        actualizarEstados,
        marcarVisita,
        getEstadoAnterior
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
