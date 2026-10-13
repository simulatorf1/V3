// Lógica de autogeneración de empresas y páginas

import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { descargarVelas, infoTicker } from './yahoo';
import { calcularSMI, zonaSMI, detectarSenales } from './indicador';

export async function obtenerOCrearEmpresa(ticker) {
  const tickerUpper = ticker.toUpperCase();

  // 1. ¿Existe ya en la tabla empresas?
  const { data: existente } = await supabase
    .from('empresas')
    .select('*')
    .eq('ticker', tickerUpper)
    .maybeSingle();

  if (existente) {
    return existente;
  }

  // 2. No existe: consultamos Yahoo para obtener info
  let info;
  try {
    info = await infoTicker(tickerUpper);
  } catch (e) {
    console.error('Error en infoTicker:', e.message);
    return null;
  }

  // 3. Insertamos la empresa en Supabase (con admin, se salta RLS)
  const { data: nueva, error } = await supabaseAdmin
    .from('empresas')
    .insert({
      ticker: info.ticker,
      nombre: info.nombre,
      mercado: info.mercado,
      sector: info.sector
    })
    .select()
    .single();

  if (error) {
    console.error('Error insertando empresa:', error);
    return null;
  }

  return nueva;
}

export async function generarAnalisis(ticker) {
  const tickerUpper = ticker.toUpperCase();

  // 1. Descargamos velas diarias (1 año)
  const { velas } = await descargarVelas(tickerUpper, '1y', '1d');
  if (!velas || velas.length < 20) {
    throw new Error('Datos insuficientes para ' + tickerUpper);
  }

  // 2. Calculamos SMI
  const smis = calcularSMI(velas);
  const smiActual = smis[smis.length - 1];
  const zona = zonaSMI(smiActual);

  // 3. Detectamos señales
  const { senales, posicionAbierta } = detectarSenales(velas, smis);

  // 4. Estadística simple: de cada señal de compra, ¿qué pasó 10 días después?
  const estadisticas = calcularEstadisticas(velas, senales, 10);

  // 5. Devolvemos todo el análisis
  return {
    ticker: tickerUpper,
    precioActual: velas[velas.length - 1].close,
    smiActual,
    zona,
    senales,
    posicionAbierta,
    estadisticas,
    velasUltimas30: velas.slice(-30).map((v) => ({
      date: v.date,
      close: v.close,
      high: v.high,
      low: v.low
    })),
    smisUltimos30: smis.slice(-30),
    generado_at: new Date().toISOString()
  };
}

function calcularEstadisticas(velas, senales, horizonte) {
  const compras = senales.filter((s) => s.tipo === 'compra');
  const ventas = senales.filter((s) => s.tipo === 'venta');

  function analizar(lista) {
    const resultados = [];
    for (const senal of lista) {
      const idx = velas.findIndex((v) => v.date === senal.fecha);
      if (idx === -1 || idx + horizonte >= velas.length) continue;
      const precioInicial = velas[idx].close;
      const precioFinal = velas[idx + horizonte].close;
      const variacion = ((precioFinal - precioInicial) / precioInicial) * 100;
      resultados.push(variacion);
    }
    if (resultados.length === 0) {
      return { muestra: 0, subidas: 0, bajadas: 0, variacionMedia: 0, porcentajeSubidas: 0, porcentajeBajadas: 0 };
    }
    const subidas = resultados.filter((v) => v > 0).length;
    const bajadas = resultados.filter((v) => v < 0).length;
    const media = resultados.reduce((a, b) => a + b, 0) / resultados.length;
    return {
      muestra: resultados.length,
      subidas,
      bajadas,
      porcentajeSubidas: (subidas / resultados.length) * 100,
      porcentajeBajadas: (bajadas / resultados.length) * 100,
      variacionMedia: media
    };
  }

  return {
    compras: analizar(compras),
    ventas: analizar(ventas),
    horizonte
  };
}
