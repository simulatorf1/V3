// lib/autogenerar.js

import { unstable_noStore as noStore } from 'next/cache';
import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { descargarVelas, infoTicker, infoFundamental } from './yahoo';
import { calcularSMI, zonaSMI, detectarSenales } from './indicador';
import { obtenerNoticias } from './noticias';
import { calcularVariacionSector } from './sector';

const MINUTOS_CACHE = 360; // 6 horas
const NUM_VELAS = 120;

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

function mergeVelas(prevVelas, nextVelas) {
  if (!Array.isArray(prevVelas) || prevVelas.length === 0) {
    return Array.isArray(nextVelas) ? nextVelas : [];
  }
  if (!Array.isArray(nextVelas) || nextVelas.length === 0) {
    return prevVelas;
  }
  const mapa = new Map();
  for (const v of prevVelas) {
    if (v && v.date) mapa.set(v.date, v);
  }
  for (const v of nextVelas) {
    if (v && v.date) mapa.set(v.date, v);
  }
  return Array.from(mapa.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function mergeAnalisis(prev, next) {
  if (!prev) return next;
  if (!next) return prev;

  const velasFusionadas = mergeVelas(prev.velasUltimas60, next.velasUltimas60);

  let smisFusionados;
  const velasCambiaron = velasFusionadas.length !== (next.velasUltimos60?.length || 0);
  if (velasCambiaron && velasFusionadas.length > 0) {
    const smisCompletos = calcularSMI(velasFusionadas);
    smisFusionados = smisCompletos.slice(-velasFusionadas.length);
  } else {
    smisFusionados =
      Array.isArray(next.smisUltimos60) && next.smisUltimos60.length
        ? next.smisUltimos60
        : prev.smisUltimos60 || [];
  }

  const precioActual = velasFusionadas.length > 0
    ? velasFusionadas[velasFusionadas.length - 1].close
    : next.precioActual ?? prev.precioActual ?? null;

  const smiActual = smisFusionados.length > 0
    ? smisFusionados[smisFusionados.length - 1]
    : next.smiActual ?? prev.smiActual ?? null;

  const zona = smiActual !== null && smiActual !== undefined
    ? zonaSMI(smiActual)
    : next.zona ?? prev.zona ?? null;

  return {
    ...next,
    velasUltimas60: velasFusionadas,
    smisUltimos60: smisFusionados,
    precioActual,
    smiActual,
    zona,

    velasSemanales:
      Array.isArray(next.velasSemanales) && next.velasSemanales.length
        ? next.velasSemanales
        : prev.velasSemanales || [],
    smisSemanales:
      Array.isArray(next.smisSemanales) && next.smisSemanales.length
        ? next.smisSemanales
        : prev.smisSemanales || [],
    smiSemanalActual: next.smiSemanalActual ?? prev.smiSemanalActual ?? null,
    zonaSemanal: next.zonaSemanal ?? prev.zonaSemanal ?? null,

    noticias:
      Array.isArray(next.noticias) && next.noticias.length
        ? next.noticias
        : prev.noticias || [],

    sectorInfo: next.sectorInfo ?? prev.sectorInfo ?? null,
    fundamentales: next.fundamentales ?? prev.fundamentales ?? null,

    senales:
      Array.isArray(next.senales) && next.senales.length
        ? next.senales
        : prev.senales || [],
    estadisticas: next.estadisticas ?? prev.estadisticas ?? null,
    posicionAbierta: next.posicionAbierta ?? prev.posicionAbierta ?? null,

    volumenMedio60: next.volumenMedio60 ?? prev.volumenMedio60 ?? null,
    volumenUltimo: next.volumenUltimo ?? prev.volumenUltimo ?? null,
    variacionEmpresa60: next.variacionEmpresa60 ?? prev.variacionEmpresa60 ?? null,

    generado_at: next.generado_at || new Date().toISOString()
  };
}

export async function obtenerOCrearEmpresa(tickerUsuario) {
  const tickerUpper = tickerUsuario.toUpperCase();

  // 1. Buscar primero en la BD (sin llamar a Yahoo)
  const { data: existente } = await supabase
    .from('empresas')
    .select('*')
    .eq('ticker', tickerUpper)
    .maybeSingle();

  if (existente) {
    // Ya existe: devolver tal cual, sin actualizar updated_at ni llamar a Yahoo
    return existente;
  }

  // 2. Si no existe, llamar a Yahoo y crear
  let info;
  try {
    info = await infoTicker(tickerUpper);
  } catch (e) {
    console.error('Yahoo no reconoce el ticker:', tickerUpper, e.message);
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
  noStore(); // Fuerza a Next.js a no cachear la consulta a Supabase

  const tickerUpper = ticker.toUpperCase();
  const slug = `${tickerUpper.toLowerCase()}__${slugify(empresa.nombre)}`;

  const { data: cache } = await supabase
    .from('paginas')
    .select('actualizado_at')
    .eq('ticker', tickerUpper)
    .maybeSingle();
  
  let datosAnteriores = null;
  if (cache && cache.actualizado_at) {
    const edadMin = (Date.now() - new Date(cache.actualizado_at).getTime()) / 60000;
    if (edadMin < MINUTOS_CACHE) {
      // Leer datos completos solo si vamos a servir caché
      const { data: cacheCompleto } = await supabase
        .from('paginas')
        .select('datos')
        .eq('ticker', tickerUpper)
        .maybeSingle();
      datosAnteriores = parseDatos(cacheCompleto?.datos);
      if (datosAnteriores) {
        return { analisis: datosAnteriores, desdeCache: true };
      }
    }
  }

  const analisis = await generarAnalisis(tickerUpper, empresa);

  const final = mergeAnalisis(datosAnteriores, analisis);

  const { error: errUpsert } = await supabaseAdmin
    .from('paginas')
    .upsert(
      {
        empresa_id: empresa.id,
        ticker: tickerUpper,
        slug,
        datos: final,
        precio_actual: final.precioActual ?? null,
        zona: final.zona ?? null,
        variacion60: final.variacionEmpresa60 ?? null,
        percentil: final.percentil ?? null,
        smi_actual: final.smiActual ?? null,
        smi_ultimos_3: final.smiUltimos3 ?? null,
        actualizado_at: new Date().toISOString()
      },
      { onConflict: 'ticker' }
    );

  if (errUpsert) {
    console.error('Error guardando análisis:', errUpsert);
  }

  return { analisis: final, desdeCache: false };
}

export async function generarAnalisis(ticker, empresa) {
  const tickerUpper = ticker.toUpperCase();

  const { velas } = await descargarVelas(tickerUpper, '1y', '1d');
  if (!velas || velas.length < 20) {
    throw new Error('Datos insuficientes para ' + tickerUpper);
  }

  let velasSemanales = [];
  let smisSemanales = [];
  let zonaSemanal = null;
  let smiSemanalActual = null;
  try {
    const { velas: semanales } = await descargarVelas(tickerUpper, '2y', '1wk');
    if (semanales && semanales.length >= 20) {
      velasSemanales = semanales.slice(-104).map((v) => ({
        date: v.date,
        open: v.open,
        high: v.high,
        low: v.low,
        close: v.close
      }));
      const smiSem = calcularSMI(semanales);
      smisSemanales = smiSem.slice(-104);
      const ultimoSmiSem = smisSemanales[smisSemanales.length - 1];
      smiSemanalActual = ultimoSmiSem;
      zonaSemanal = zonaSMI(ultimoSmiSem);
    }
  } catch (e) {
    console.error('Error descargando velas semanales:', e.message);
    velasSemanales = [];
    smisSemanales = [];
    zonaSemanal = null;
    smiSemanalActual = null;
  }

  const smis = calcularSMI(velas);
  const smiActual = smis[smis.length - 1];
  const zona = zonaSMI(smiActual);

  const { senales, posicionAbierta } = detectarSenales(velas, smis);

  const estadisticas = calcularEstadisticas(velas, senales);

  const noticias = await obtenerNoticias(tickerUpper, 5);

  if (noticias && noticias.length > 0) {
    const filas = noticias
      .filter((n) => n.url && n.titulo)
      .map((n) => ({
        ticker: tickerUpper,
        titulo: n.titulo,
        fuente: n.fuente || null,
        url: n.url,
        fecha_publicacion: n.fecha_publicacion || null
      }));
    if (filas.length > 0) {
      await supabaseAdmin
        .from('noticias')
        .upsert(filas, { onConflict: 'url', ignoreDuplicates: true });
    }
  }

  const ultimas = velas.slice(-NUM_VELAS);
  const volumenesValidos = ultimas
    .map((v) => v.volume)
    .filter((v) => v !== null && v !== undefined && v > 0);
  const volumenMedio =
    volumenesValidos.length > 0
      ? volumenesValidos.reduce((a, b) => a + b, 0) / volumenesValidos.length
      : null;
  const volumenUltimo = velas[velas.length - 1].volume || null;

  let variacionEmpresa60 = null;
  const ultimas60ParaVariacion = velas.slice(-60);
  if (ultimas60ParaVariacion.length >= 60) {
    const primero = ultimas60ParaVariacion[0].close;
    const ultimo = ultimas60ParaVariacion[ultimas60ParaVariacion.length - 1].close;
    if (primero) {
      variacionEmpresa60 = ((ultimo - primero) / primero) * 100;
    }
  }

  const smis60 = smis.slice(-60).filter((v) => v !== null && v !== undefined);
  let percentil = null;
  if (smis60.length > 0 && smiActual !== null && smiActual !== undefined) {
    const menores = smis60.filter((v) => v < smiActual).length;
    percentil = Math.round((menores / smis60.length) * 100);
  }

  const smiUltimos3 = smis.slice(-3);

  let sectorInfo = null;
  if (empresa?.sector) {
    const variacion = await calcularVariacionSector(empresa.sector);
    if (variacion) {
      sectorInfo = {
        sector: empresa.sector,
        etf: variacion.etf,
        variacionSector60: variacion.variacion,
        variacionEmpresa60
      };
    }
  }

  const fundamentales = null;


  return {
    ticker: tickerUpper,
    precioActual: velas[velas.length - 1].close,
    smiActual,
    zona,
    senales,
    posicionAbierta,
    estadisticas,
    noticias,
    volumenMedio60: volumenMedio,
    volumenUltimo,
    variacionEmpresa60,
    percentil,
    smiUltimos3,
    sectorInfo,
    velasUltimas60: velas.slice(-NUM_VELAS).map((v) => ({
      date: v.date,
      open: v.open,
      high: v.high,
      low: v.low,
      close: v.close
    })),
    smisUltimos60: smis.slice(-NUM_VELAS),
    velasSemanales,
    smisSemanales,
    zonaSemanal,
    smiSemanalActual,
    fundamentales,
    generado_at: new Date().toISOString()
  };
}

function calcularEstadisticas(velas, senales) {
  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const precioActual = velas[velas.length - 1].close;

  const ciclos = [];
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i];
    const siguiente = lista[i + 1];
    const precioCierre = siguiente ? siguiente.precio : precioActual;
    const variacion = ((precioCierre - s.precio) / s.precio) * 100;
    ciclos.push({
      tipo: s.tipo,
      fecha: s.fecha,
      variacion,
      abierto: !siguiente
    });
  }

  const compras = ciclos.filter((c) => c.tipo === 'compra');
  const ventas = ciclos.filter((c) => c.tipo === 'venta');

  function analizar(listaCiclos) {
    let aciertos = 0;
    let total = 0;
    for (const c of listaCiclos) {
      if (c.variacion === 0) continue;
      total++;
      if (c.tipo === 'compra' && c.variacion > 0) aciertos++;
      if (c.tipo === 'venta' && c.variacion < 0) aciertos++;
    }
    const porcentajeAcierto = total > 0 ? (aciertos / total) * 100 : 0;
    const variacionMedia =
      listaCiclos.length > 0
        ? listaCiclos.reduce((a, c) => a + c.variacion, 0) / listaCiclos.length
        : 0;

    return {
      muestra: listaCiclos.length,
      aciertos,
      fallos: total - aciertos,
      porcentajeAcierto,
      variacionMedia
    };
  }

  const comprasStats = analizar(compras);
  const ventasStats = analizar(ventas);

  const ultimaSenal = lista.length > 0 ? lista[lista.length - 1] : null;
  const ultimaSenalTipo = ultimaSenal ? ultimaSenal.tipo : null;

  let porcentajeUltimaSenal = null;
  if (ultimaSenalTipo === 'compra') porcentajeUltimaSenal = comprasStats.porcentajeAcierto;
  if (ultimaSenalTipo === 'venta') porcentajeUltimaSenal = ventasStats.porcentajeAcierto;

  return {
    compras: comprasStats,
    ventas: ventasStats,
    ultimaSenalTipo,
    porcentajeUltimaSenal
  };
}
