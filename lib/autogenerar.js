// Lógica de autogeneración de empresas y páginas

import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { descargarVelas, infoTicker } from './yahoo';
import { calcularSMI, zonaSMI, detectarSenales } from './indicador';

// Minutos de validez de la caché antes de regenerar
const MINUTOS_CACHE = 60;

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function obtenerOCrearEmpresa(ticker) {
  const tickerUpper = ticker.toUpperCase();

  const { data: existente } = await supabase
    .from('empresas')
    .select('*')
    .eq('ticker', tickerUpper)
    .maybeSingle();

  if (existente) return existente;

  let info;
  try {
    info = await infoTicker(tickerUpper);
  } catch (e) {
    console.error('Error en infoTicker:', e.message);
    return null;
  }

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

export async function obtenerAnalisis(ticker, empresa) {
  const tickerUpper = ticker.toUpperCase();
  const slug = `${tickerUpper.toLowerCase()}-${slugify(empresa.nombre)}`;

  // 1. ¿Tenemos análisis en caché?
  const { data: cache } = await supabase
    .from('paginas')
    .select('datos, actualizado_at')
    .eq('ticker', tickerUpper)
    .maybeSingle();

  if (cache) {
    const edadMin = (Date.now() - new Date(cache.actualizado_at).getTime()) / 60000;
    if (edadMin < MINUTOS_CACHE) {
      return { analisis: cache.datos, desdeCache: true };
    }
  }

  // 2. Regeneramos
  const analisis = await generarAnalisis(tickerUpper);

  // 3. Guardamos (upsert)
  const { error: errUpsert } = await supabaseAdmin
    .from('paginas')
    .upsert(
      {
        empresa_id: empresa.id,
        ticker: tickerUpper,
        slug,
        datos: analisis,
        actualizado_at: new Date().toISOString()
      },
      { onConflict: 'ticker' }
    );

  if (errUpsert) {
    console.error('Error guardando análisis:', errUpsert);
  }

  return { analisis, desdeCache: false };
}

export async function generarAnalisis(ticker) {
  const tickerUpper = ticker.toUpperCase();

  const { velas } = await descargarVelas(tickerUpper, '1y', '1d');
  if (!velas || velas.length < 20) {
    throw new Error('Datos insuficientes para ' + tickerUpper);
  }

  const smis = calcularSMI(velas);
  const smiActual = smis[smis.length - 1];
  const zona = zonaSMI(smiActual);

  const { senales, posicionAbierta } = detectarSenales(velas, smis);

  const estadisticas = calcularEstadisticas(velas, senales, 10);

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
