// lib/veredicto.js
const N_MINIMO = 3;
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

function fraseHorizonte(proy, etiqueta) {
  if (!proy || proy.total === 0) return `A ${etiqueta}, sin casos suficientes.`;
  const may = ladoMayoritario(proy);
  const verbo = may.lado === 'subidas' ? 'subió' : 'bajó';
  const retorno =
    proy.retornoMedio !== undefined && proy.retornoMedio !== null
      ? `${proy.retornoMedio >= 0 ? '+' : ''}${proy.retornoMedio}%`
      : '—';
  return `A ${etiqueta}, el precio ${verbo} el ${may.pct}% de las veces (${may.veces} de ${proy.total}). Retorno medio: ${retorno}.`;
}

export function calcularVeredicto({ proyeccionDiaria, proyeccionSemanal, nombreEmpresa, precioActual }) {
  const ref =
    (proyeccionDiaria?.total || 0) >= (proyeccionSemanal?.total || 0)
      ? proyeccionDiaria
      : proyeccionSemanal;

  if (!ref || ref.total < N_MINIMO) {
    return {
      estado: 'ambiguo',
      color: '#9ca3af',
      titulo: 'Datos históricos insuficientes',
      texto: `Solo ${ref?.total || 0} casos históricos similares (mínimo ${N_MINIMO}).`,
      parrafoCompleto: null
    };
  }

  const may = ladoMayoritario(ref);
  const pendienteTxt =
    ref.pendienteActual === null || ref.pendienteActual === undefined
      ? ''
      : ref.pendienteActual >= 0
      ? 'y con pendiente positiva'
      : 'y con pendiente negativa';

  const intro = `**${nombreEmpresa || 'La empresa'}** cotiza a **${Number(precioActual).toFixed(2)} €**. Actualmente el indicador Equaty marca **${Math.round(ref.smiActual ?? 0)}** ${pendienteTxt}. Hemos encontrado **${proyeccionDiaria?.total || 0} casos históricos similares a corto plazo** y **${proyeccionSemanal?.total || 0} a largo plazo**: situaciones pasadas en las que el indicador estuvo a ±${ref.rangoValor} puntos del valor actual y con la misma pendiente.`;

  const corto = fraseHorizonte(proyeccionDiaria, 'corto plazo (10 sesiones)');
  const largo = fraseHorizonte(proyeccionSemanal, 'largo plazo (10 semanas)');

  const conclusion =
    may.pct >= UMBRAL_MAYORITARIO
      ? may.lado === 'subidas'
        ? 'El contexto histórico es favorable.'
        : 'El contexto histórico es desfavorable.'
      : 'Sin ventaja estadística clara.';

  const parrafoCompleto = `${intro} ${corto} ${largo} ${conclusion}`;

  let estado, color, titulo;
  if (may.pct >= UMBRAL_MAYORITARIO) {
    const favorable = may.lado === 'subidas';
    estado = favorable ? 'favorable' : 'desfavorable';
    color = favorable ? '#16a34a' : '#dc2626';
    titulo = favorable ? 'Contexto históricamente favorable' : 'Contexto históricamente desfavorable';
  } else {
    estado = 'neutral';
    color = '#f59e0b';
    titulo = 'Contexto histórico mixto';
  }

  return {
    estado,
    color,
    titulo,
    texto: parrafoCompleto,
    parrafoCompleto,
    detalle: {
      totalDiario: proyeccionDiaria?.total || 0,
      totalSemanal: proyeccionSemanal?.total || 0,
      smiActual: ref.smiActual,
      pendienteActual: ref.pendienteActual,
      rangoValor: ref.rangoValor
    }
  };
}

export { ladoMayoritario };
