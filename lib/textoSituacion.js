// lib/textoSituacion.js

/**
 * Genera el texto de proyección histórica para la ficha.
 * - Si no hay proyección diaria ni semanal, solo muestra el precio.
 * - Si solo hay una, muestra solo esa.
 * - Si hay ambas, muestra las dos.
 * Usa **texto** para las negritas; se renderiza con renderizarNegritas() en page.js.
 */
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

  if (proyeccionDiaria) {
    const { total, subidas, bajadas, pctSubidas } = proyeccionDiaria;
    let b = `en el **gráfico diario** `;
    if (subidas > 0 && bajadas > 0) {
      b += `**subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**) y **bajó en ${bajadas} de ${total}**`;
    } else if (subidas > 0) {
      b += `**subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**)`;
    } else if (bajadas > 0) {
      b += `**bajó en ${bajadas} de ${total} casos**`;
    }
    bloques.push(b);
  }

  if (proyeccionSemanal) {
    const { total, subidas, bajadas, pctSubidas } = proyeccionSemanal;
    let b = `en el **gráfico semanal** `;
    if (subidas > 0 && bajadas > 0) {
      b += `**subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**) y **bajó en ${bajadas} de ${total}**`;
    } else if (subidas > 0) {
      b += `**subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**)`;
    } else if (bajadas > 0) {
      b += `**bajó en ${bajadas} de ${total} casos**`;
    }
    bloques.push(b);
  }

  let cuerpo = intro + ' ';
  if (bloques.length === 1) {
    cuerpo += bloques[0] + '.';
  } else {
    cuerpo += bloques[0] + '; y ' + bloques[1] + '.';
  }

  cuerpo += ' Puedes verlo en el gráfico.';

  return `${precioTxt} ${cuerpo}`;
}
