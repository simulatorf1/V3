// lib/textoSituacion.js

/**
 * Elige la dirección mayoritaria y devuelve un texto con los datos en **negrita**.
 * - Si subidas > bajadas → habla de subidas.
 * - Si bajadas > subidas → habla de bajadas.
 * - Si empatan → habla de ambas.
 * - Si solo hay una dirección → habla de esa.
 * - Si no hay casos → null.
 */
function bloqueDireccion(proyeccion, etiqueta) {
  if (!proyeccion) return null;
  const { total, subidas, bajadas } = proyeccion;
  if (total === 0) return null;

  const pctSubidas = Math.round((subidas / total) * 100);
  const pctBajadas = 100 - pctSubidas;

  if (subidas > bajadas) {
    return `en el **${etiqueta}** **subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**)`;
  }
  if (bajadas > subidas) {
    return `en el **${etiqueta}** **bajó en ${bajadas} de ${total} casos** (**${pctBajadas}% de bajadas**)`;
  }
  return `en el **${etiqueta}** **subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**) y **bajó en ${bajadas} de ${total}** (**${pctBajadas}% de bajadas**)`;
}

export function generarTextoProyeccion({
  nombre,
  precioActual,
  proyeccionDiaria,
  proyeccionSemanal
}) {
  if (!nombre) return null;

  const precioTxt =
    precioActual !== null && precioActual !== undefined
      ? `**${nombre}** cotiza a **${Number(precioActual).toFixed(2)} €**.`
      : `**${nombre}**.`;

  if (!proyeccionDiaria && !proyeccionSemanal) {
    return `${precioTxt} No hay suficientes casos históricos similares para estimar una proyección.`;
  }

  const intro =
    'En los datos históricos que manejamos, nuestro indicador Equaty está coincidiendo con situaciones del pasado en las que el precio, después de estar en esa misma posición,';

  const bloques = [];

  const bDiario = bloqueDireccion(proyeccionDiaria, 'gráfico diario');
  if (bDiario) bloques.push(bDiario);

  const bSemanal = bloqueDireccion(proyeccionSemanal, 'gráfico semanal');
  if (bSemanal) bloques.push(bSemanal);

  let cuerpo = intro + ' ';
  if (bloques.length === 1) {
    cuerpo += bloques[0] + '.';
  } else {
    cuerpo += bloques[0] + '; y ' + bloques[1] + '.';
  }

  cuerpo += ' Puedes verlo en el gráfico.';

  return `${precioTxt} ${cuerpo}`;
}
