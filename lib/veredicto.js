// lib/veredicto.js
const N_MINIMO = 30;
const UMBRAL_FAVORABLE = 65;
const UMBRAL_DESFAVORABLE = 35;

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
      texto: `Solo ${ref?.total || 0} casos históricos similares (mínimo ${N_MINIMO} para un veredicto fiable).`
    };
  }

  const pct = ref.pctSubidas;
  const horizonte =
    ref === proyeccionDiaria ? 'corto plazo (10 sesiones)' : 'largo plazo (10 semanas)';
  const retorno =
    ref.retornoMedio !== undefined && ref.retornoMedio !== null
      ? `${ref.retornoMedio >= 0 ? '+' : ''}${ref.retornoMedio}%`
      : '—';

  if (pct >= UMBRAL_FAVORABLE) {
    return {
      estado: 'favorable',
      color: '#16a34a',
      titulo: 'Contexto históricamente favorable',
      texto: `En ${ref.total} casos similares, el precio subió el ${pct}% de las veces a ${horizonte}. Retorno medio: ${retorno}.`
    };
  }

  if (pct <= UMBRAL_DESFAVORABLE) {
    return {
      estado: 'desfavorable',
      color: '#dc2626',
      titulo: 'Contexto históricamente desfavorable',
      texto: `En ${ref.total} casos similares, el precio subió solo el ${pct}% de las veces a ${horizonte}. Retorno medio: ${retorno}.`
    };
  }

  return {
    estado: 'neutral',
    color: '#f59e0b',
    titulo: 'Contexto histórico mixto',
    texto: `En ${ref.total} casos similares, el precio subió el ${pct}% de las veces a ${horizonte}. Sin ventaja estadística clara.`
  };
}
