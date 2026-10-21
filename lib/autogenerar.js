// Lógica de autogeneración de empresas y páginas

import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { descargarVelas, infoTicker } from './yahoo';
import { calcularSMI, zonaSMI, detectarSenales } from './indicador';
import { obtenerNoticias } from './noticias';
import { calcularVariacionSector } from './sector';

const MINUTOS_CACHE = 60;

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function obtenerOCrearEmpresa(tickerUsuario) {
  const tickerUpper = tickerUsuario.toUpperCase();

  let info;
  try {
    info = await infoTicker(tickerUpper);
  } catch (e) {
    const { data: existente } = await supabase
      .from('empresas')
      .select('*')
      .eq('ticker', tickerUpper)
      .maybeSingle();
    if (existente) return existente;
    console.error('Yahoo no reconoce el ticker:', tickerUpper, e.message);
    return null;
  }

  const tickerReal = info.ticker;

  const { data: existente } = await supabase
    .from('empresas')
    .select('*')
    .eq('ticker', tickerReal)
    .maybeSingle();

  if (existente) {
    await supabaseAdmin
      .from('empresas')
      .update({
        nombre: info.nombre,
        mercado: info.mercado,
        sector: info.sector,
        updated_at: new Date().toISOString()
      })
      .eq('id', existente.id);
    return { ...existente, nombre: info.nombre, mercado: info.mercado, sector: info.sector };
  }

  const { data: nueva, error } = await supabaseAdmin
    .from('empresas')
    .insert({
      ticker: tickerReal,
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
  const slug = `${tickerUpper.toLowerCase()}__${slugify(empresa.nombre)}`;

  const { data: cache } = await supabase
    .from('paginas')
    .select('datos, actualizado_at')
    .eq('ticker', tickerUpper)
    .maybeSingle();

  if (cache && cache.datos) {
    const edadMin = (Date.now() - new Date(cache.actualizado_at).getTime()) / 60000;
    if (edadMin < MINUTOS_CACHE) {
      let datosParsed = null;
      try {
        datosParsed = typeof cache.datos === 'string' ? JSON.parse(cache.datos) : cache.datos;
      } catch (e) {
        console.error('Error parseando cache:', e.message);
      }
      if (datosParsed) {
        return { analisis: datosParsed, desdeCache: true };
      }
    }
  }

  const analisis = await generarAnalisis(tickerUpper, empresa);

  // NO tocamos ultimo_movimiento_anterior. Solo lo hace el cron.
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

export async function generarAnalisis(ticker, empresa) {
  const tickerUpper = ticker.toUpperCase();

  const { velas } = await descargarVelas(tickerUpper, '1y', '1d');
  if (!velas || velas.length < 20) {
    throw new Error('Datos insuficientes para ' + tickerUpper);
  }

  // NUEVO: velas semanales + SMI semanal
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
  // FIN NUEVO

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

  const ultimas60 = velas.slice(-60);
  const volumenesValidos = ultimas60
    .map((v) => v.volume)
    .filter((v) => v !== null && v !== undefined && v > 0);
  const volumenMedio60 =
    volumenesValidos.length > 0
      ? volumenesValidos.reduce((a, b) => a + b, 0) / volumenesValidos.length
      : null;
  const volumenUltimo = velas[velas.length - 1].volume || null;

  let variacionEmpresa60 = null;
  if (ultimas60.length >= 60) {
    const primero = ultimas60[0].close;
    const ultimo = ultimas60[ultimas60.length - 1].close;
    if (primero) {
      variacionEmpresa60 = ((ultimo - primero) / primero) * 100;
    }
  }

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

  return {
    ticker: tickerUpper,
    precioActual: velas[velas.length - 1].close,
    smiActual,
    zona,
    senales,
    posicionAbierta,
    estadisticas,
    noticias,
    volumenMedio60,
    volumenUltimo,
    variacionEmpresa60,
    sectorInfo,
    velasUltimas60: velas.slice(-60).map((v) => ({
      date: v.date,
      open: v.open,
      high: v.high,
      low: v.low,
      close: v.close
    })),
    smisUltimos60: smis.slice(-60),
    // NUEVO: semanales
    velasSemanales,
    smisSemanales,
    zonaSemanal,
    smiSemanalActual,
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
