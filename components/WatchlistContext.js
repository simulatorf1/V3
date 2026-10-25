'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const WatchlistContext = createContext({
  lista: [],
  agregar: () => {},
  quitar: () => {},
  tiene: () => false,
  listo: false,
  zonas: {},
  ultimaVisita: null,
  actualizarZonas: () => {},
  marcarVisita: () => {},
  getZonaAnterior: () => null
});

const STORAGE_KEY = 'equaty_watchlist_v1';
const ESTADO_KEY = 'equaty_watchlist_estado_v1';

export function WatchlistProvider({ children }) {
  const [lista, setLista] = useState([]);
  const [zonas, setZonas] = useState({});
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
          if (parsedEstado.zonas && typeof parsedEstado.zonas === 'object') {
            setZonas(parsedEstado.zonas);
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

  function persistirEstado(nuevasZonas, nuevaUltimaVisita) {
    try {
      window.localStorage.setItem(
        ESTADO_KEY,
        JSON.stringify({
          zonas: nuevasZonas,
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
    setZonas((prev) => {
      const nuevas = { ...prev };
      delete nuevas[t];
      persistirEstado(nuevas, ultimaVisita);
      return nuevas;
    });
  }

  function tiene(ticker) {
    if (!ticker) return false;
    return lista.includes(String(ticker).toUpperCase());
  }

  function actualizarZonas(nuevasZonas) {
    if (!nuevasZonas || typeof nuevasZonas !== 'object') return;
    setZonas((prev) => {
      const combinado = { ...prev, ...nuevasZonas };
      persistirEstado(combinado, ultimaVisita);
      return combinado;
    });
  }

  function marcarVisita() {
    const ahora = new Date().toISOString();
    setUltimaVisita(ahora);
    persistirEstado(zonas, ahora);
  }

  function getZonaAnterior(ticker) {
    if (!ticker) return null;
    return zonas[String(ticker).toUpperCase()] || null;
  }

  return (
    <WatchlistContext.Provider
      value={{
        lista,
        agregar,
        quitar,
        tiene,
        listo,
        zonas,
        ultimaVisita,
        actualizarZonas,
        marcarVisita,
        getZonaAnterior
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
