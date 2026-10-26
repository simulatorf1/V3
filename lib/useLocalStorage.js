'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';

function dispatchStorageEvent(key, newValue) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
}

export function useLocalStorage(key, defaultValue) {
  const defaultRef = useRef(defaultValue);

  const subscribe = useCallback(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const handler = (e) => {
        if (e.key === key || e.key === null) callback();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? stored : defaultRef.current;
    } catch {
      return defaultRef.current;
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => defaultRef.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (newValue) => {
      try {
        const current = window.localStorage.getItem(key) ?? defaultRef.current;
        const valueToStore =
          typeof newValue === 'function' ? newValue(current) : newValue;
        window.localStorage.setItem(key, valueToStore);
        dispatchStorageEvent(key, valueToStore);
      } catch (err) {
        console.error(`Error guardando en localStorage "${key}":`, err);
      }
    },
    [key]
  );

  return [value, setValue];
}
