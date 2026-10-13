// Cálculo de la media del sector usando ETFs de referencia

import { descargarVelas } from './yahoo';

const MAPA_SECTORES = {
  'tecnología': 'XLK',
  'technology': 'XLK',
  'energía': 'XLE',
  'energy': 'XLE',
  'financiero': 'XLF',
  'financial': 'XLF',
  'banca': 'XLF',
  'salud': 'XLV',
  'healthcare': 'XLV',
  'consumo': 'XLP',
  'consumer': 'XLP',
  'industrial': 'XLI',
  'industrials': 'XLI',
  'industria': 'XLI',
  'telecomunicaciones': 'XLC',
  'communication': 'XLC',
  'utilities': 'XLU',
  'materiales': 'XLB',
  'materials': 'XLB',
  'inmobiliario': 'XLRE',
  'real estate': 'XLRE'
};

export function normalizarSector(sector) {
  if (!sector) return null;
  const s = sector.toLowerCase().trim();
  for (const clave of Object.keys(MAPA_SECTORES)) {
    if (s.includes(clave)) return clave;
  }
  return null;
}

export function etfDelSector(sector) {
  const normalizado = normalizarSector(sector);
  if (!normalizado) return null;
  return MAPA_SECTORES[normalizado] || null;
}

export async function calcularVariacionSector(sector) {
  const etf = etfDelSector(sector);
  if (!etf) return null;

  try {
    const { velas } = await descargarVelas(etf, '3mo', '1d');
    if (!velas || velas.length < 60) return null;

    const ultimas60 = velas.slice(-60);
    const primero = ultimas60[0].close;
    const ultimo = ultimas60[ultimas60.length - 1].close;

    if (!primero) return null;
    const variacion = ((ultimo - primero) / primero) * 100;

    return {
      etf,
      variacion,
      sectorNormalizado: normalizarSector(sector)
    };
  } catch (err) {
    console.error('Error calculando variación del sector:', err);
    return null;
  }
}
