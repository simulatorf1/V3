// lib/textoSituacion.js
import { ladoMayoritario } from './veredicto';

const HORIZONTE_DIARIO = 'en los 10 días siguientes';
const HORIZONTE_SEMANAL = 'en las 10 semanas siguientes';

function bloqueDireccion(proyeccion, horizonte) {
  if (!proyeccion) return null;
  const may = ladoMayoritario(proyeccion);
  if (!may) return null;
  const verbo = may.lado === 'subidas' ? 'subió' : 'bajó';
  return `${horizonte} **${verbo} en ${may.veces} de ${may.total} casos** (**${may.pct}% de ${may.lado}**)`;
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
  if (bloques.length === 1) cuerpo += bloques[0] + '.';
  else if (bloques.length === 2) cuerpo += bloques[0] + '; y ' + bloques[1] + '.';
  else return `${precioTxt} Sin casos históricos suficientes.`;

  cuerpo += ' Puedes verlo en los gráficos.';

  return `${precioTxt} ${cuerpo}`;
}
