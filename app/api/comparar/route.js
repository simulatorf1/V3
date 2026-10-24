import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function parseDatos(datos) {
  if (!datos) return null;
  if (typeof datos === 'string') {
    try {
      return JSON.parse(datos);
    } catch (e) {
      return null;
    }
  }
  return datos;
}

function calcularVariacion(velas, sesiones) {
  if (!velas || velas.length < 2) return null;
  let primero;
  if (sesiones >= velas.length - 1) {
    primero = velas[0]?.close;
  } else {
    primero = velas[velas.length - sesiones - 1]?.close;
  }
  const ultimo = velas[velas.length - 1]?.close;
  if (!primero || primero === 0) return null;
  return ((ultimo - primero) / primero) * 100;
}

function calcularPercentil(smis, smiActual) {
  if (!smis || smis.length === 0 || smiActual === null || smiActual === undefined) return null;
  const validos = smis.filter((v) => v !== null && v !== undefined);
  if (validos.length === 0) return null;
  const menores = validos.filter((v) => v < smiActual).length;
  return Math.round((menores / validos.length) * 100);
}

function calcularIndicadores(datos) {
  const velas = datos.velasUltimas60 || [];
  const smis = datos.smisUltimos60 || [];
  const precioActual = datos.precioActual;

  const max60 = velas.length > 0 ? Math.max(...velas.map((v) => v.high)) : null;
  const min60 = velas.length > 0 ? Math.min(...velas.map((v) => v.low)) : null;

  const posicionRango =
    max60 !== null && min60 !== null && max60 !== min60
      ? ((precioActual - min60) / (max60 - min60)) * 100
      : null;

  const amplitudRango =
    min60 !== null && min60 !== 0 && max60 !== null
      ? ((max60 - min60) / min60) * 100
      : null;

  const distanciaMax = max60 ? ((precioActual - max60) / max60) * 100 : null;
  const distanciaMin = min60 ? ((precioActual - min60) / min60) * 100 : null;

  let volatilidad = null;
  if (velas.length > 1) {
    const retornos = [];
    for (let i = 1; i < velas.length; i++) {
      if (velas[i - 1]?.close) {
        retornos.push((velas[i].close - velas[i - 1].close) / velas[i - 1].close);
      }
    }
    if (retornos.length > 0) {
      const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
      const varianza =
        retornos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / retornos.length;
      volatilidad = Math.sqrt(varianza) * 100;
    }
  }

  let volatilidadSemanal = null;
  const velasSem = datos.velasSemanales || [];
  if (velasSem.length > 1) {
    const retsSem = [];
    for (let i = 1; i < velasSem.length; i++) {
      if (velasSem[i - 1]?.close) {
        retsSem.push((velasSem[i].close - velasSem[i - 1].close) / velasSem[i - 1].close);
      }
    }
    if (retsSem.length > 0) {
      const mediaSem = retsSem.reduce((a, b) => a + b, 0) / retsSem.length;
      const varSem =
        retsSem.reduce((a, b) => a + Math.pow(b - mediaSem, 2), 0) / retsSem.length;
      volatilidadSemanal = Math.sqrt(varSem) * 100;
    }
  }

  let sesionesAlcistas = 0;
  let sesionesBajistas = 0;
  for (let i = 1; i < velas.length; i++) {
    if (velas[i].close > velas[i - 1].close) sesionesAlcistas++;
    else if (velas[i].close < velas[i - 1].close) sesionesBajistas++;
  }
  const totalSesionesMov = sesionesAlcistas + sesionesBajistas;
  const ratioAlcistas =
    totalSesionesMov > 0 ? (sesionesAlcistas / totalSesionesMov) * 100 : null;

  let racha = 0;
  let direccionRacha = null;
  for (let i = velas.length - 1; i >= 1; i--) {
    const dif = velas[i].close - velas[i - 1].close;
    if (dif === 0) break;
    const dir = dif > 0 ? 'alcista' : 'bajista';
    if (direccionRacha === null) {
      direccionRacha = dir;
      racha = 1;
    } else if (dir === direccionRacha) {
      racha++;
    } else {
      break;
    }
  }

  const smiActual = datos.smiActual;
  const smi5Atras = smis.length >= 6 ? smis[smis.length - 6] : null;
  const pendienteIndicador =
    smi5Atras !== null &&
    smi5Atras !== undefined &&
    smi5Atras !== 0 &&
    smiActual !== null
      ? ((smiActual - smi5Atras) / Math.abs(smi5Atras)) * 100
      : null;

  const senales = datos.senales || [];
  const cambiosZona60 = senales.length;

  const smisValidos = smis.filter((v) => v !== null && v !== undefined);
  const sesionesEnZona = smisValidos.filter((s) => {
    if (datos.zona === 'alta') return s > 40;
    if (datos.zona === 'baja') return s < -40;
    return s >= -40 && s <= 40;
  }).length;
  const totalSesionesValidas = smisValidos.length;

  return {
    variacion5: calcularVariacion(velas, 5),
    variacion60: calcularVariacion(velas, 60),
    percentil: calcularPercentil(smis, smiActual),
    posicionRango,
    amplitudRango,
    distanciaMax,
    distanciaMin,
    volatilidad,
    volatilidadSemanal,
    sesionesAlcistas,
    sesionesBajistas,
    ratioAlcistas,
    racha,
    direccionRacha,
    pendienteIndicador,
    cambiosZona60,
    sesionesEnZona,
    totalSesionesValidas
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers') || '';

  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);

  if (tickers.length === 0) {
    return Response.json({ empresas: [], noEncontrados: [] });
  }

  try {
    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos')
      .in('ticker', tickers);

    const { data: empresasData } = await supabaseAdmin
      .from('empresas')
      .select('ticker, nombre, sector')
      .in('ticker', tickers);

    const empresasMap = {};
    for (const e of empresasData || []) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const encontrados = new Set();
    const empresas = [];

    for (const p of paginas || []) {
      const datos = parseDatos(p.datos);
      if (!datos) continue;

      const emp = empresasMap[p.ticker];
      const indicadores = calcularIndicadores(datos);

      empresas.push({
        ticker: p.ticker,
        nombre: emp?.nombre || p.ticker,
        sector: emp?.sector || null,
        precio: datos.precioActual ?? null,
        zona: datos.zona || null,
        smiActual: datos.smiActual ?? null,
        variacionSector60: datos.sectorInfo?.variacionSector60 ?? null,
        ...indicadores
      });
      encontrados.add(p.ticker);
    }

    const noEncontrados = tickers.filter((t) => !encontrados.has(t));

    return Response.json({ empresas, noEncontrados });
  } catch (err) {
    console.error('Error en /api/comparar:', err);
    return Response.json(
      { empresas: [], noEncontrados: tickers, error: err.message },
      { status: 200 }
    );
  }
}
