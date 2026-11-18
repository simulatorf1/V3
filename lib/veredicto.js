// lib/veredicto.js
const N_MINIMO = 10;
const UMBRAL_MAYORITARIO = 60;

function ladoMayoritario(p) {
  if (!p || p.total === 0) return null;
  const pctSubidas = Math.round((p.subidas / p.total) * 100);
  const pctBajadas = 100 - pctSubidas;
  if (pctSubidas >= pctBajadas) {
    return { lado: 'subidas', pct: pctSubidas, veces: p.subidas, total: p.total };
  }
  return { lado: 'bajadas', pct: pctBajadas, veces: p.bajadas, total: p.total };
}

export function calcularVeredicto({ proyeccionDiaria, proyeccionSemanal }) {
  const ref =
    (proyeccionDiaria?.total || 0) >= (proyeccionSemanal?.total || 0)
      ? proyeccionDiaria
      : proyeccionSemanal;

  if (!ref || ref.total < N_MINIMO) {
    return {
      estado: 'ambiguo',
      color: '#9ca3af',
      titulo: 'Datos históricos insuficientes',
      texto: `Solo ${ref?.total || 0} casos históricos similares (mínimo ${N_MINIMO}).`
    };
  }

  const may = ladoMayoritario(ref);
  const horizonte =
    ref === proyeccionDiaria ? 'corto plazo (10 sesiones)' : 'largo plazo (10 semanas)';
  const retorno =
    ref.retornoMedio !== undefined && ref.retornoMedio !== null
      ? `${ref.retornoMedio >= 0 ? '+' : ''}${ref.retornoMedio}%`
      : '—';

  if (may.pct >= UMBRAL_MAYORITARIO) {
    const favorable = may.lado === 'subidas';
    return {
      estado: favorable ? 'favorable' : 'desfavorable',
      color: favorable ? '#16a34a' : '#dc2626',
      titulo: favorable
        ? 'Contexto históricamente favorable'
        : 'Contexto históricamente desfavorable',
      texto: `En ${ref.total} casos similares a ${horizonte}, el precio ${
        favorable ? 'subió' : 'bajó'
      } el ${may.pct}% de las veces (${may.veces} de ${ref.total}). Retorno medio: ${retorno}.`
    };
  }

  return {
    estado: 'neutral',
    color: '#f59e0b',
    titulo: 'Contexto histórico mixto',
    texto: `En ${ref.total} casos similares a ${horizonte}, el precio ${
      may.lado === 'subidas' ? 'subió' : 'bajó'
    } el ${may.pct}% de las veces (${may.veces} de ${ref.total}). Sin ventaja clara. Retorno medio: ${retorno}.`
  };
}

export { ladoMayoritario };
