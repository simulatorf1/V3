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
const ESTADO_KEY_VIEJA = 'equaty_watchlist_estado_v1';

function limpiarClave(clave) {
  try {
    window.localStorage.removeItem(clave);
  } catch (e) {}
}

export function WatchlistProvider({ children }) {
  const [lista, setLista] = useState([]);
  const [estados, setEstados] = useState({});
  const [ultimaVisita, setUltimaVisita] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // 1. Cargar lista
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const limpia = parsed
            .filter((t) => typeof t === 'string' && t.length > 0)
            .map((t) => t.toUpperCase());
          setLista(limpia);
        }
      }
    } catch (e) {
      limpiarClave(STORAGE_KEY);
    }

    // 2. Cargar estados (v2) o migrar desde v1
    try {
      const rawV2 = window.localStorage.getItem(ESTADO_KEY);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        if (parsed && typeof parsed === 'object') {
          if (parsed.estados && typeof parsed.estados === 'object') {
            setEstados(parsed.estados);
          }
          if (parsed.ultimaVisita && typeof parsed.ultimaVisita === 'string') {
            setUltimaVisita(parsed.ultimaVisita);
          }
        }
      } else {
        // Intento de migración desde v1
        const rawV1 = window.localStorage.getItem(ESTADO_KEY_VIEJA);
        if (rawV1) {
          try {
            const parsedV1 = JSON.parse(rawV1);
            if (parsedV1 && typeof parsedV1 === 'object' && parsedV1.zonas && typeof parsedV1.zonas === 'object') {
              const migrados = {};
              for (const [ticker, zona] of Object.entries(parsedV1.zonas)) {
                if (typeof ticker === 'string' && typeof zona === 'string') {
                  migrados[ticker.toUpperCase()] = {
                    zona,
                    variacion60: null,
                    indicador: null,
                    percentil: null
                  };
                }
              }
              setEstados(migrados);
              if (parsedV1.ultimaVisita && typeof parsedV1.ultimaVisita === 'string') {
                setUltimaVisita(parsedV1.ultimaVisita);
              }
            }
          } catch (e) {
            // si v1 está corrupto, se ignora
          }
        }
      }
    } catch (e) {
      limpiarClave(ESTADO_KEY);
    }

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
      // Limpiar la clave vieja si existe
      if (window.localStorage.getItem(ESTADO_KEY_VIEJA)) {
        window.localStorage.removeItem(ESTADO_KEY_VIEJA);
      }
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
