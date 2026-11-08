// lib/proyeccion.js
// Cálculo compartido de proyección histórica (misma lógica que Grafico.js)

const VENTANA = 10;
const RANGO_VALOR = 30;

function calcularPendiente(smis, idx) {
  if (idx < 1) return null;
  const actual = smis[idx];
  const anterior = smis[idx - 1];
  if (actual === null || actual === undefined) return null;
  if (anterior === null || anterior === undefined) return null;
  return actual - anterior;
}

export function calcularProyeccion(velas, smis) {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) return null;

  const idxActual = smis.length - 1;
  const smiActual = smis[idxActual];
  if (smiActual === null || smiActual === undefined) return null;

  const pendienteActual = calcularPendiente(smis, idxActual);

  const casos = [];

  for (let i = idxActual - 1; i >= 0; i--) {
    if (i + VENTANA >= velas.length) continue;

    const v = smis[i];
    if (v === null || v === undefined) continue;
    if (Math.abs(v - smiActual) > RANGO_VALOR) continue;

    const pend = calcularPendiente(smis, i);
    if (pend === null) continue;

    if (pendienteActual !== null) {
      if (pendienteActual >= 0 && pend < 0) continue;
      if (pendienteActual < 0 && pend >= 0) continue;
    }

    const precioInicio = velas[i].close;
    const precioFin = velas[i + VENTANA].close;
    const variacion = ((precioFin - precioInicio) / precioInicio) * 100;

    casos.push({ variacion });
  }

  if (casos.length === 0) return null;

  const subidas = casos.filter((c) => c.variacion > 0).length;
  const bajadas = casos.filter((c) => c.variacion < 0).length;
  const total = casos.length;
  const pctSubidas = Math.round((subidas / total) * 100);

  return { total, subidas, bajadas, pctSubidas };
}
