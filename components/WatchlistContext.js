'use client';

import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../lib/useLocalStorage';

const WatchlistContext = createContext({
  lista: [],
  agregar: () => {},
  quitar: () => {},
  tiene: () => false,
  listo: true,
  estados: {},
  ultimaVisita: null,
  actualizarEstados: () => {},
  marcarVisita: () => {},
  getEstadoAnterior: () => null
});

export function WatchlistProvider({ children }) {
  const [listaRaw, setListaRaw] = useLocalStorage('equaty_watchlist_v1', '[]');
  const [estadoRaw, setEstadoRaw] = useLocalStorage('equaty_watchlist_estado_v2', '{}');

  const lista = useMemo(() => {
    try {
      const parsed = JSON.parse(listaRaw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t) => typeof t === 'string' && t.length > 0)
          .map((t) => t.toUpperCase());
      }
    } catch (e) {}
    return [];
  }, [listaRaw]);

  const estado = useMemo(() => {
    try {
      const parsed = JSON.parse(estadoRaw);
      if (parsed && typeof parsed === 'object') {
        return {
          estados: parsed.estados && typeof parsed.estados === 'object' ? parsed.estados : {},
          ultimaVisita: parsed.ultimaVisita || null
        };
      }
    } catch (e) {}
    return { estados: {}, ultimaVisita: null };
  }, [estadoRaw]);

  const agregar = useCallback((ticker) => {
    if (!ticker) return;
    const t = String(ticker).toUpperCase();
    setListaRaw((prevRaw) => {
      try {
        const prev = JSON.parse(prevRaw);
        if (Array.isArray(prev) && prev.includes(t)) return prevRaw;
        const nueva = [...(Array.isArray(prev) ? prev : []), t];
        return JSON.stringify(nueva);
      } catch (e) {
        return JSON.stringify([t]);
      }
    });
  }, [setListaRaw]);

  const quitar = useCallback((ticker) => {
    if (!ticker) return;
    const t = String(ticker).toUpperCase();
    setListaRaw((prevRaw) => {
      try {
        const prev = JSON.parse(prevRaw);
        if (Array.isArray(prev)) {
          return JSON.stringify(prev.filter((x) => x !== t));
        }
      } catch (e) {}
      return prevRaw;
    });
    setEstadoRaw((prevRaw) => {
      try {
        const prev = JSON.parse(prevRaw);
        if (prev && prev.estados) {
          const nuevos = { ...prev.estados };
          delete nuevos[t];
          return JSON.stringify({ ...prev, estados: nuevos });
        }
      } catch (e) {}
      return prevRaw;
    });
  }, [setListaRaw, setEstadoRaw]);

  const tiene = useCallback((ticker) => {
    if (!ticker) return false;
    return lista.includes(String(ticker).toUpperCase());
  }, [lista]);

  const actualizarEstados = useCallback((nuevosEstados) => {
    if (!nuevosEstados || typeof nuevosEstados !== 'object') return;
    setEstadoRaw((prevRaw) => {
      try {
        const prev = JSON.parse(prevRaw);
        const estadosPrev = prev && prev.estados ? prev.estados : {};
        const combinado = { ...estadosPrev, ...nuevosEstados };
        return JSON.stringify({ ...prev, estados: combinado });
      } catch (e) {
        return JSON.stringify({ estados: nuevosEstados, ultimaVisita: null });
      }
    });
  }, [setEstadoRaw]);

  const marcarVisita = useCallback(() => {
    const ahora = new Date().toISOString();
    setEstadoRaw((prevRaw) => {
      try {
        const prev = JSON.parse(prevRaw);
        return JSON.stringify({ ...prev, ultimaVisita: ahora });
      } catch (e) {
        return JSON.stringify({ estados: {}, ultimaVisita: ahora });
      }
    });
  }, [setEstadoRaw]);

  const getEstadoAnterior = useCallback((ticker) => {
    if (!ticker) return null;
    return estado.estados[String(ticker).toUpperCase()] || null;
  }, [estado]);

  const value = useMemo(() => ({
    lista,
    agregar,
    quitar,
    tiene,
    listo: true,
    estados: estado.estados,
    ultimaVisita: estado.ultimaVisita,
    actualizarEstados,
    marcarVisita,
    getEstadoAnterior
  }), [lista, agregar, quitar, tiene, estado, actualizarEstados, marcarVisita, getEstadoAnterior]);

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
