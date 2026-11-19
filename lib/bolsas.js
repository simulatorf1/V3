// lib/bolsas.js
export const BOLSAS = [
  { codigo: 'mc', nombre: 'Madrid', sufijo: '.MC' },
  { codigo: 'de', nombre: 'Frankfurt', sufijo: '.DE' },
  { codigo: 'pa', nombre: 'París', sufijo: '.PA' },
  { codigo: 'l', nombre: 'Londres', sufijo: '.L' },
  { codigo: 'as', nombre: 'Ámsterdam', sufijo: '.AS' },
  { codigo: 'mi', nombre: 'Milán', sufijo: '.MI' },
  { codigo: 'sw', nombre: 'Suiza', sufijo: '.SW' },
  { codigo: 'st', nombre: 'Estocolmo', sufijo: '.ST' },
  { codigo: 'ol', nombre: 'Oslo', sufijo: '.OL' },
  { codigo: 'co', nombre: 'Copenhague', sufijo: '.CO' },
  { codigo: 'he', nombre: 'Helsinki', sufijo: '.HE' },
  { codigo: 'ls', nombre: 'Lisboa', sufijo: '.LS' },
  { codigo: 'br', nombre: 'Bruselas', sufijo: '.BR' },
  { codigo: 'vi', nombre: 'Viena', sufijo: '.VI' },
  { codigo: 'ir', nombre: 'Dublín', sufijo: '.IR' },
  { codigo: 'ax', nombre: 'Australia', sufijo: '.AX' },
  { codigo: 'hk', nombre: 'Hong Kong', sufijo: '.HK' },
  { codigo: 't', nombre: 'Tokio', sufijo: '.T' },
  { codigo: 'us', nombre: 'EE.UU.', sufijo: '' }
];

export function bolsaDesdeTicker(ticker) {
  if (!ticker) return null;
  const t = ticker.toUpperCase();
  // Buscar sufijo de bolsa (ej: TEF.MC → mc)
  const match = t.match(/\.([A-Z]+)$/);
  if (match) {
    const codigo = match[1].toLowerCase();
    const bolsa = BOLSAS.find((b) => b.codigo === codigo);
    if (bolsa) return bolsa.codigo;
  }
  // Si no tiene sufijo, asumir EE.UU.
  return 'us';
}

export function nombreBolsa(codigo) {
  const bolsa = BOLSAS.find((b) => b.codigo === codigo);
  return bolsa ? bolsa.nombre : codigo;
}
