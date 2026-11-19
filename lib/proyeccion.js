// lib/proyeccion.js
const VENTANA_DIARIA = 10;
const VENTANA_SEMANAL = 10;
const RANGO_VALOR = 30;
const SEPARACION_MINIMA = 5;

function calcularPendiente(smis, idx) {
  if (idx < 1) return null;
  const actual = smis[idx];
  const anterior = smis[idx - 1];
  if (actual === null || actual === undefined) return null;
  if (anterior === null || anterior === undefined) return null;
  return actual - anterior;
}

function sumarDiasHabiles(fechaISO, dias) {
  const f = new Date(fechaISO + 'T00:00:00');
  let contados = 0;
  while (contados < dias) {
    f.setDate(f.getDate() + 1);
    const dw = f.getDay();
    if (dw !== 0 && dw !== 6) contados++;
  }
  return f.toISOString().slice(0, 10);
}

function sumarSemanas(fechaISO, semanas) {
  const f = new Date(fechaISO + 'T00:00:00');
  f.setDate(f.getDate() + semanas * 7);
  const dw = f.getDay();
  if (dw !== 5) {
    const diff = 5 - dw;
    f.setDate(f.getDate() + diff);
  }
  return f.toISOString().slice(0, 10);
}

// Similitud 0-100% en función de la distancia al SMI actual
function calcularSimilitud(distancia, rango) {
  if (rango <= 0) return 100;
  const s = 100 * (1 - distancia / rango);
  return Math.max(0, Math.min(100, Math.round(s)));
}

// Peso suavizado: 0.5 en el borde, 1.0 en el centro
function pesoDesdeSimilitud(similitud) {
  return 0.5 + 0.5 * (similitud / 100);
}

function mediaPonderada(valores, pesos) {
  if (valores.length === 0) return null;
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  if (sumaPesos === 0) return valores.reduce((a, b) => a + b, 0) / valores.length;
  const suma = valores.reduce((acc, v, i) => acc + v * pesos[i], 0);
  return suma / sumaPesos;
}

export function calcularProyeccion(velas, smis, horizonte = 'diario') {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) return null;

  const VENTANA = horizonte === 'semanal' ? VENTANA_SEMANAL : VENTANA_DIARIA;
  const idxActual = smis.length - 1;
  const smiActual = smis[idxActual];
  if (smiActual === null || smiActual === undefined) return null;

  const pendienteActual = calcularPendiente(smis, idxActual);

  const candidatos = [];
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
    const distancia = Math.abs(v - smiActual);
    const similitud = calcularSimilitud(distancia, RANGO_VALOR);

    candidatos.push({
      indexFecha: i,
      fecha: velas[i].date,
      fechaFin: velas[i + VENTANA].date,
      smi: v,
      distancia,
      similitud,
      peso: pesoDesdeSimilitud(similitud),
      variacion,
      precioInicioReal: precioInicio,
      precioFinReal: precioFin,
      smiPendiente: pend
    });
  }

  if (candidatos.length === 0) return null;

  const ordenados = [...candidatos].sort((a, b) => a.distancia - b.distancia);
  const seleccionados = [];
  for (const c of ordenados) {
    const demasiadoCerca = seleccionados.some(
      (s) => Math.abs(s.indexFecha - c.indexFecha) < SEPARACION_MINIMA
    );
    if (!demasiadoCerca) seleccionados.push(c);
  }

  if (seleccionados.length === 0) return null;

  const fechaHoy = velas[velas.length - 1].date;
  const precioHoy = velas[velas.length - 1].close;

  const fechasEje = [fechaHoy];
  for (let d = 1; d <= VENTANA; d++) {
    if (horizonte === 'semanal') {
      fechasEje.push(sumarSemanas(fechaHoy, d));
    } else {
      fechasEje.push(sumarDiasHabiles(fechaHoy, d));
    }
  }

  const casos = seleccionados.map((c) => {
    const precios = [{ d: 0, valor: precioHoy, fecha: fechaHoy }];
    for (let d = 1; d <= VENTANA; d++) {
      const vela = velas[c.indexFecha + d];
      if (!vela) break;
      const normalizado = precioHoy * (vela.close / c.precioInicioReal);
      precios.push({ d, valor: normalizado, fecha: fechasEje[d] });
    }
    return { ...c, precios };
  });

  const total = casos.length;
  const subidas = casos.filter((c) => c.variacion > 0).length;
  const bajadas = casos.filter((c) => c.variacion < 0).length;
  const pctSubidas = Math.round((subidas / total) * 100);

  const pesos = casos.map((c) => c.peso);
  const variaciones = casos.map((c) => c.variacion);

  // Media simple vs ponderada del retorno
  const retornoMedioSimple =
    Math.round((variaciones.reduce((a, b) => a + b, 0) / total) * 100) / 100;
  const retornoMedioPonderado =
    Math.round(mediaPonderada(variaciones, pesos) * 100) / 100;
  const retornoMedio = retornoMedioPonderado;

  // Precio final (día VENTANA): simple y ponderado
  const preciosFinales = casos
    .map((c) => c.precios.find((p) => p.d === VENTANA)?.valor)
    .filter((v) => v !== undefined && v !== null);

  const precioFinalMedioSimple =
    preciosFinales.length > 0
      ? Math.round((preciosFinales.reduce((a, b) => a + b, 0) / preciosFinales.length) * 100) / 100
      : null;
  const precioFinalMedioPonderado =
    preciosFinales.length > 0
      ? Math.round(mediaPonderada(preciosFinales, pesos.slice(0, preciosFinales.length)) * 100) / 100
      : null;
  const precioFinalMedio = precioFinalMedioPonderado;

  const precioFinalMediano =
    preciosFinales.length > 0
      ? (() => {
          const s = [...preciosFinales].sort((a, b) => a - b);
          const m = Math.floor(s.length / 2);
          return Math.round((s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) * 100) / 100;
        })()
      : null;

  const fechaHorizonte = fechasEje[VENTANA];
  const casosOrdenados = [...casos].sort((a, b) => a.distancia - b.distancia);

  // Bandas y media ponderada por día
  const bandas = [];
  for (let d = 0; d <= VENTANA; d++) {
    const pares = casos
      .map((c, i) => {
        const p = c.precios.find((pp) => pp.d === d);
        return p ? { valor: p.valor, peso: pesos[i] } : null;
      })
      .filter(Boolean);

    if (pares.length === 0) continue;

    const valoresOrdenados = pares.map((p) => p.valor).sort((a, b) => a - b);
    const q = (p) => {
      const pos = (valoresOrdenados.length - 1) * p;
      const base = Math.floor(pos);
      const resto = pos - base;
      if (valoresOrdenados[base + 1] !== undefined) {
        return valoresOrdenados[base] + resto * (valoresOrdenados[base + 1] - valoresOrdenados[base]);
      }
      return valoresOrdenados[base];
    };

    const mediaPondDia = mediaPonderada(
      pares.map((p) => p.valor),
      pares.map((p) => p.peso)
    );

    bandas.push({
      d,
      fecha: fechasEje[d],
      media: d === 0 ? precioHoy : mediaPondDia,
      p10: q(0.1),
      p25: q(0.25),
      p50: d === 0 ? precioHoy : q(0.5),
      p75: q(0.75),
      p90: q(0.9)
    });
  }
  if (bandas[0]) {
    bandas[0].p10 = bandas[0].p25 = bandas[0].p50 = bandas[0].p75 = bandas[0].p90 = precioHoy;
    bandas[0].media = precioHoy;
  }

  // Distribución
  const min = Math.min(...variaciones);
  const max = Math.max(...variaciones);
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
    retornoMedioSimple,
    retornoMedioPonderado,
    precioFinalMedio,
    precioFinalMedioSimple,
    precioFinalMedioPonderado,
    precioFinalMediano,
    fechaHorizonte,
    casos: casosOrdenados,
    bandas,
    distribucion: bins,
    fechaHoy,
    precioHoy,
    fechasEje,
    smiActual,
    pendienteActual,
    rangoValor: RANGO_VALOR,
    ventana: VENTANA,
    horizonte
  };
}
