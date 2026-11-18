// lib/proyeccion.js
// Cálculo compartido de proyección histórica.
// Ampliado: retorno medio, casos con fecha, trayectorias y distribución.

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

    // Trayectoria normalizada a 100 en el punto de partida (día 0)
    const trayectoria = [{ d: 0, valor: 100 }];
    for (let d = 1; d <= VENTANA; d++) {
      const vela = velas[i + d];
      if (!vela) break;
      trayectoria.push({
        d,
        valor: (vela.close / precioInicio) * 100
      });
    }

    casos.push({
      fecha: velas[i].date,
      fechaFin: velas[i + VENTANA].date,
      smi: v,
      variacion,
      trayectoria
    });
  }

  if (casos.length === 0) return null;

  const subidas = casos.filter((c) => c.variacion > 0).length;
  const bajadas = casos.filter((c) => c.variacion < 0).length;
  const total = casos.length;
  const pctSubidas = Math.round((subidas / total) * 100);
  const retornoMedio =
    Math.round((casos.reduce((acc, c) => acc + c.variacion, 0) / total) * 100) / 100;

  const casosOrdenados = [...casos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  // Bandas de probabilidad por día (cuantiles de la trayectoria)
  const bandas = [];
  for (let d = 0; d <= VENTANA; d++) {
    const valores = casos
      .map((c) => c.trayectoria.find((t) => t.d === d)?.valor)
      .filter((v) => v !== undefined && v !== null)
      .sort((a, b) => a - b);

    if (valores.length === 0) continue;

    const q = (p) => {
      const pos = (valores.length - 1) * p;
      const base = Math.floor(pos);
      const resto = pos - base;
      if (valores[base + 1] !== undefined) {
        return valores[base] + resto * (valores[base + 1] - valores[base]);
      }
      return valores[base];
    };

    bandas.push({
      d,
      p10: q(0.1),
      p25: q(0.25),
      p50: q(0.5),
      p75: q(0.75),
      p90: q(0.9)
    });
  }

  // Distribución de retornos por bins (para histograma)
  const min = Math.min(...casos.map((c) => c.variacion));
  const max = Math.max(...casos.map((c) => c.variacion));
  const rango = max - min;
  const numBins = Math.min(20, Math.max(8, Math.ceil(Math.sqrt(total))));
  const anchoBin = rango / numBins || 1;

  const bins = Array.from({ length: numBins }, (_, i) => ({
    desde: min + i * anchoBin,
    hasta: min + (i + 1) * anchoBin,
    count: 0
  }));

  for (const c of casos) {
    let idx = Math.floor((c.variacion - min) / anchoBin);
    if (idx >= numBins) idx = numBins - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }

  return {
    total,
    subidas,
    bajadas,
    pctSubidas,
    retornoMedio,
    casos: casosOrdenados,
    bandas,
    distribucion: bins
  };
}
