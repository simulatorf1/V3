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
  const horizonte =
    ref === proyeccionDiaria ? 'corto plazo (10 sesiones)' : 'largo plazo (10 semanas)';
  const retorno =
    ref.retornoMedio !== undefined && ref.retornoMedio !== null
      ? `${ref.retornoMedio >= 0 ? '+' : ''}${ref.retornoMedio}%`
      : '—';

  const pendienteTxt =
    ref.pendienteActual === null || ref.pendienteActual === undefined
      ? ''
      : ref.pendienteActual >= 0
      ? 'y con pendiente positiva'
      : 'y con pendiente negativa';

  const intro = `**${nombreEmpresa || 'La empresa'}** cotiza a **${Number(precioActual).toFixed(2)} €**. Actualmente el indicador Equaty marca **${Math.round(ref.smiActual ?? 0)}** ${pendienteTxt}. Hemos encontrado **${ref.total} casos históricos similares**: situaciones pasadas en las que el indicador estuvo a ±${ref.rangoValor} puntos del valor actual y con la misma pendiente.`;

  const resultado = `En esos ${ref.total} casos, a ${horizonte} el precio **${
    may.lado === 'subidas' ? 'subió' : 'bajó'
  } el ${may.pct}% de las veces** (${may.veces} de ${ref.total}). Retorno medio: **${retorno}**.`;

  const conclusion =
    may.pct >= UMBRAL_MAYORITARIO
      ? may.lado === 'subidas'
        ? 'El contexto histórico es favorable.'
        : 'El contexto histórico es desfavorable.'
      : 'Sin ventaja estadística clara.';

  const parrafoCompleto = `${intro} ${resultado} ${conclusion}`;

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
    texto: resultado,
    parrafoCompleto,
    detalle: {
      total: ref.total,
      subidas: ref.subidas,
      bajadas: ref.bajadas,
      pctSubidas: ref.pctSubidas,
      retornoMedio: ref.retornoMedio,
      smiActual: ref.smiActual,
      pendienteActual: ref.pendienteActual,
      rangoValor: ref.rangoValor
    }
  };
}

export { ladoMayoritario };
