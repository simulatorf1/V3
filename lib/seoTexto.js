// Genera el bloque SEO único por empresa con plantillas fijas.
// Sin adjetivos valorativos. Sin lenguaje direccional.

export function generarTextoSEO({ empresa, analisis }) {
  if (!empresa || !analisis) return null;

  const p1 = parrafoEmpresa(empresa);
  const p2 = parrafoPrecio(analisis);
  const p3 = parrafoIndicador(analisis);
  const p4 = parrafoSector(empresa, analisis);

  return {
    parrafos: [p1, p2, p3, p4].filter(Boolean),
    textoCompleto: [p1, p2, p3, p4].filter(Boolean).join('\n\n')
  };
}

function parrafoEmpresa(empresa) {
  const nombre = empresa.nombre;
  const ticker = empresa.ticker;
  const sector = empresa.sector || 'sector no especificado';
  const mercado = empresa.mercado || 'mercado no especificado';

  return `${nombre} (${ticker}) cotiza en ${mercado} y pertenece al sector ${sector}. La información utilizada en este análisis procede de series históricas públicas de mercado y se actualiza de forma automática.`;
}

function parrafoPrecio(analisis) {
  const velas = analisis.velasUltimas60 || [];
  if (velas.length < 60) return null;

  const primerCierre = velas[0].close;
  const ultimoCierre = velas[velas.length - 1].close;
  const maximo = Math.max(...velas.map((v) => v.high));
  const minimo = Math.min(...velas.map((v) => v.low));
  const variacion = ((ultimoCierre - primerCierre) / primerCierre) * 100;

  const volatilidad = calcularVolatilidad(velas);

  return `En las últimas 60 sesiones, el precio de cierre ha pasado de ${primerCierre.toFixed(2)} a ${ultimoCierre.toFixed(2)}, lo que supone una variación del ${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)}%. El rango de cotización en ese periodo se ha situado entre un mínimo de ${minimo.toFixed(2)} y un máximo de ${maximo.toFixed(2)}. La volatilidad diaria media del periodo ha sido del ${volatilidad.toFixed(2)}%.`;
}

function parrafoIndicador(analisis) {
  const smi = analisis.smiActual;
  const zona = analisis.zona;
  const smis = (analisis.smisUltimos60 || []).filter((v) => v !== null && v !== undefined);
  if (smis.length === 0) return null;

  const ordenados = [...smis].sort((a, b) => a - b);
  const menores = ordenados.filter((v) => v < smi).length;
  const percentil = Math.round((menores / ordenados.length) * 100);

  const stats = analisis.estadisticas;
  let detalleEstadistico = '';

  if (stats && stats.compras && typeof stats.compras.porcentajeAcierto === 'number' && stats.compras.muestra > 0) {
    detalleEstadistico += `De las señales previas de compra registradas por el algoritmo en el último año, el ${stats.compras.porcentajeAcierto.toFixed(1)}% cerraron con subida de precio hasta la siguiente señal (basado en ${stats.compras.muestra} observaciones). `;
  }
  if (stats && stats.ventas && typeof stats.ventas.porcentajeAcierto === 'number' && stats.ventas.muestra > 0) {
    detalleEstadistico += `De las señales previas de venta, el ${stats.ventas.porcentajeAcierto.toFixed(1)}% cerraron con bajada de precio hasta la siguiente señal (basado en ${stats.ventas.muestra} observaciones).`;
  }
  if (!detalleEstadistico) {
    detalleEstadistico = 'No se han registrado señales suficientes en el último año para calcular frecuencias históricas.';
  }

  return `El indicador propietario se encuentra actualmente en zona ${zona}, con un valor de ${smi.toFixed(2)} y un percentil ${percentil} dentro del rango de las últimas 60 sesiones. ${detalleEstadistico} Estos datos describen comportamiento histórico y no constituyen una predicción del futuro.`;
}

function parrafoSector(empresa, analisis) {
  const info = analisis.sectorInfo;
  if (!info) {
    return `No se dispone de datos comparativos sectoriales para ${empresa.nombre} en este momento.`;
  }

  const varEmp = info.variacionEmpresa60;
  const varSec = info.variacionSector60;
  if (varEmp === null || varEmp === undefined || varSec === null || varSec === undefined) {
    return `No se dispone de datos comparativos sectoriales para ${empresa.nombre} en este momento.`;
  }

  return `En los últimos 60 días, ${empresa.nombre} ha registrado una variación del ${varEmp >= 0 ? '+' : ''}${varEmp.toFixed(2)}%, mientras que la media del sector ${info.sector} ha registrado una variación del ${varSec >= 0 ? '+' : ''}${varSec.toFixed(2)}% (referencia: ETF ${info.etf}).`;
}

function calcularVolatilidad(velas) {
  const retornos = [];
  for (let i = 1; i < velas.length; i++) {
    const r = (velas[i].close - velas[i - 1].close) / velas[i - 1].close;
    retornos.push(r);
  }
  if (retornos.length === 0) return 0;
  const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
  const varianza = retornos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / retornos.length;
  const desv = Math.sqrt(varianza);
  return desv * 100;
}
