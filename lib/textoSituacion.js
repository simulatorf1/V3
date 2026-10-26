export function generarTextoSituacion({
  nombre,
  zona,
  percentil,
  smiActual,
  pendienteIndicador,
  posicionRango,
  distanciaMax,
  distanciaMin,
  variacionSector60,
  variacion60
}) {
  if (!nombre || !zona) return null;

  const partes = [];

  // Parte 1: situación actual
  let situacion = '';
  if (zona === 'alta') {
    situacion = `${nombre} se encuentra en la parte alta de su rango de 60 sesiones`;
  } else if (zona === 'baja') {
    situacion = `${nombre} se encuentra en la parte baja de su rango de 60 sesiones`;
  } else {
    situacion = `${nombre} se encuentra en la parte intermedia de su rango de 60 sesiones`;
  }

  if (percentil !== null && percentil !== undefined) {
    if (percentil >= 80) situacion += ', con un percentil elevado';
    else if (percentil >= 60) situacion += ', con un percentil medio-alto';
    else if (percentil >= 40) situacion += ', en torno a la zona central de su rango';
    else if (percentil >= 20) situacion += ', con un percentil medio-bajo';
    else situacion += ', con un percentil reducido';
  }

  if (distanciaMax !== null && distanciaMax !== undefined && distanciaMax > -3 && distanciaMax <= 0) {
    situacion += ' y se mantiene muy cerca de los máximos recientes';
  } else if (distanciaMin !== null && distanciaMin !== undefined && distanciaMin >= 0 && distanciaMin < 3) {
    situacion += ' y se mantiene muy cerca de los mínimos recientes';
  }

  situacion += '.';
  partes.push(situacion);

  // Parte 2: factores que explican la situación
  const factores = [];

  if (pendienteIndicador !== null && pendienteIndicador !== undefined) {
    if (pendienteIndicador > 2) factores.push('una mejora reciente del indicador Equaty');
    else if (pendienteIndicador < -2) factores.push('un deterioro reciente del indicador Equaty');
  }

  if (variacionSector60 !== null && variacionSector60 !== undefined && variacion60 !== null) {
    const diff = variacion60 - variacionSector60;
    if (diff > 2) factores.push('un comportamiento relativo superior a la media de su sector');
    else if (diff < -2) factores.push('un comportamiento relativo inferior a la media de su sector');
    else factores.push('un comportamiento alineado con la media de su sector');
  }

  if (factores.length > 0) {
    let textoFactores = 'Esta situación viene acompañada por ';
    if (factores.length === 1) {
      textoFactores += factores[0] + '.';
    } else if (factores.length === 2) {
      textoFactores += factores[0] + ' y por ' + factores[1] + '.';
    } else {
      textoFactores += factores[0] + ', por ' + factores[1] + ' y por ' + factores[2] + '.';
    }
    partes.push(textoFactores);
  }

  return partes.join(' ');
}
