'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const WatchlistContext = createContext({
  lista: [],
  agregar: () => {},
  quitar: () => {},
  tiene: () => false,
  listo: false
});

const STORAGE_KEY = 'equaty_watchlist_v1';

export function WatchlistProvider({ children }) {
  const [lista, setLista] = useState([]);
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
    } catch (e) {
      // si falla el parseo, empezamos vacío
    }
    setListo(true);
  }, []);

  function persistir(nuevaLista) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
    } catch (e) {}
  }

  function agregar(ticker) {
    if (!ticker) return;
    const t = String(ticker).toUpperCase();
    setLista((prev) => {
      if (prev.includes(t)) return prev;
      const nueva = [...prev, t];
      persistir(nueva);
      return nueva;
    });
  }

  function quitar(ticker) {
    if (!ticker) return;
    const t = String(ticker).toUpperCase();
    setLista((prev) => {
      const nueva = prev.filter((x) => x !== t);
      persistir(nueva);
      return nueva;
    });
  }

  function tiene(ticker) {
    if (!ticker) return false;
    return lista.includes(String(ticker).toUpperCase());
  }

  return (
    <WatchlistContext.Provider value={{ lista, agregar, quitar, tiene, listo }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
