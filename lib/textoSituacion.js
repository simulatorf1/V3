// lib/textoSituacion.js

const HORIZONTE_DIARIO = 'en los 10 días siguientes';
const HORIZONTE_SEMANAL = 'en las 10 semanas siguientes';

function bloqueDireccion(proyeccion, horizonte) {
  if (!proyeccion) return null;
  const { total, subidas, bajadas } = proyeccion;
  if (total === 0) return null;

  const pctSubidas = Math.round((subidas / total) * 100);
  const pctBajadas = 100 - pctSubidas;

  if (subidas > bajadas) {
    return `${horizonte} **subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**)`;
  }
  if (bajadas > subidas) {
    return `${horizonte} **bajó en ${bajadas} de ${total} casos** (**${pctBajadas}% de bajadas**)`;
  }
  return `${horizonte} **subió en ${subidas} de ${total} casos** (**${pctSubidas}% de subidas**) y **bajó en ${bajadas} de ${total}** (**${pctBajadas}% de bajadas**)`;
}

/**
 * Devuelve un cierre directo al usuario según los horizontes disponibles.
 * - Si hay diario y semanal: "Si vas a corto plazo... Si vas a largo plazo..."
 * - Si solo diario: "Si vas a corto plazo..."
 * - Si solo semanal: "Si vas a largo plazo..."
 */
function cierreDirecto(proyeccionDiaria, proyeccionSemanal) {
  const partes = [];

  if (proyeccionDiaria) {
    const { total, subidas, bajadas } = proyeccionDiaria;
    if (total > 0) {
      const pctSubidas = Math.round((subidas / total) * 100);
      const pctBajadas = 100 - pctSubidas;
      if (bajadas > subidas) {
        partes.push(`**Si vas a corto plazo**, ten en cuenta que estadísticamente ha bajado más veces (**${pctBajadas}% de bajadas**).`);
      } else if (subidas > bajadas) {
        partes.push(`**Si vas a corto plazo**, ten en cuenta que estadísticamente ha subido más veces (**${pctSubidas}% de subidas**).`);
      } else {
        partes.push(`**Si vas a corto plazo**, ha subido y bajado por igual (**${pctSubidas}% / ${pctBajadas}%**).`);
      }
    }
  }

  if (proyeccionSemanal) {
    const { total, subidas, bajadas } = proyeccionSemanal;
    if (total > 0) {
      const pctSubidas = Math.round((subidas / total) * 100);
      const pctBajadas = 100 - pctSubidas;
      if (bajadas > subidas) {
        partes.push(`**Si vas a largo plazo**, ten en cuenta que estadísticamente ha bajado más veces (**${pctBajadas}% de bajadas**).`);
      } else if (subidas > bajadas) {
        partes.push(`**Si vas a largo plazo**, ten en cuenta que estadísticamente ha subido más veces (**${pctSubidas}% de subidas**).`);
      } else {
        partes.push(`**Si vas a largo plazo**, ha subido y bajado por igual (**${pctSubidas}% / ${pctBajadas}%**).`);
      }
    }
  }

  return partes.join(' ');
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

  const bDiario = bloqueDireccion(proyeccionDiaria, HORIZONTE_DIARIO);
  if (bDiario) bloques.push(bDiario);

  const bSemanal = bloqueDireccion(proyeccionSemanal, HORIZONTE_SEMANAL);
  if (bSemanal) bloques.push(bSemanal);

  let cuerpo = intro + ' ';
  if (bloques.length === 1) {
    cuerpo += bloques[0] + '.';
  } else {
    cuerpo += bloques[0] + '; y ' + bloques[1] + '.';
  }

  cuerpo += ' Puedes verlo en el gráfico.';

  const cierre = cierreDirecto(proyeccionDiaria, proyeccionSemanal);

  return `${precioTxt} ${cuerpo} ${cierre}`;
}
