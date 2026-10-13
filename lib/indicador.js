// Cálculo del SMI (Stochastic Momentum Index) — replica del original en Python

function ema(values, span) {
  const k = 2 / (span + 1);
  const out = [];
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || isNaN(v)) {
      out.push(null);
      continue;
    }
    if (prev === null) {
      prev = v;
    } else {
      prev = v * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

function rollingMax(values, window) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      out.push(null);
      continue;
    }
    let max = -Infinity;
    for (let j = i - window + 1; j <= i; j++) {
      if (values[j] > max) max = values[j];
    }
    out.push(max);
  }
  return out;
}

function rollingMin(values, window) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      out.push(null);
      continue;
    }
    let min = Infinity;
    for (let j = i - window + 1; j <= i; j++) {
      if (values[j] < min) min = values[j];
    }
    out.push(min);
  }
  return out;
}

function rollingMean(values, window) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      out.push(null);
      continue;
    }
    let sum = 0;
    let count = 0;
    for (let j = i - window + 1; j <= i; j++) {
      if (values[j] !== null && values[j] !== undefined && !isNaN(values[j])) {
        sum += values[j];
        count++;
      }
    }
    out.push(count === window ? sum / window : null);
  }
  return out;
}

export function calcularSMI(velas) {
  // velas: array de { high, low, close }
  const high = velas.map((v) => v.high);
  const low = velas.map((v) => v.low);
  const close = velas.map((v) => v.close);

  const lengthK = 10;
  const lengthD = 3;
  const smoothPeriod = 5;
  const epsilon = 1e-9;

  const hh = rollingMax(high, lengthK);
  const ll = rollingMin(low, lengthK);

  const diff = hh.map((h, i) => (h === null || ll[i] === null ? null : h - ll[i]));
  const mid = hh.map((h, i) => (h === null || ll[i] === null ? null : (h + ll[i]) / 2));
  const rdiff = close.map((c, i) => (mid[i] === null ? null : c - mid[i]));

  const avgrel = ema(rdiff, lengthD);
  const avgdiff = ema(diff, lengthD);

  const smiRaw = avgrel.map((r, i) => {
    if (r === null || avgdiff[i] === null) return null;
    const denom = avgdiff[i] / 2 + epsilon;
    let val = (r / denom) * 100;
    if (val > 100) val = 100;
    if (val < -100) val = -100;
    return val;
  });

  const smiSuavizado = rollingMean(smiRaw, smoothPeriod);

  return smiSuavizado;
}

export function zonaSMI(smi) {
  if (smi === null || smi === undefined) return 'desconocida';
  if (smi > 40) return 'alta';
  if (smi < -40) return 'baja';
  return 'intermedia';
}

export function detectarSenales(velas, smis) {
  const senales = [];
  let posicionAbierta = false;
  let precioCompra = 0;

  for (let i = 2; i < smis.length; i++) {
    const s = smis[i];
    const s1 = smis[i - 1];
    const s2 = smis[i - 2];

    if (s === null || s1 === null || s2 === null) continue;

    const pendActual = s - s1;
    const pendAnterior = s1 - s2;

    // Compra
    if (pendActual > 0 && pendAnterior <= 0 && !posicionAbierta && s1 < 40) {
      posicionAbierta = true;
      precioCompra = velas[i - 1].close;
      senales.push({
        tipo: 'compra',
        fecha: velas[i - 1].date,
        precio: precioCompra,
        smiEnSenal: s1
      });
    }
    // Venta
    else if (pendActual < 0 && pendAnterior >= 0 && posicionAbierta) {
      posicionAbierta = false;
      senales.push({
        tipo: 'venta',
        fecha: velas[i - 1].date,
        precio: velas[i - 1].close,
        smiEnSenal: s1
      });
    }
  }

  return { senales, posicionAbierta };
}
