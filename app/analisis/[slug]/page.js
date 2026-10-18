import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Grafico from '../../../components/Grafico';
import ContextoReciente from '../../../components/ContextoReciente';
import ComparadorSector from '../../../components/ComparadorSector';
import TablaSenales from '../../../components/TablaSenales';
import RegistrarVisita from '../../../components/RegistrarVisita';
import BarraLateral from '../../../components/BarraLateral';
import BotonesCompartir from '../../../components/BotonesCompartir';
import ConsensoComunidad from '../../../components/ConsensoComunidad';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = 'https://equaty.es';
const MAX_SENALES_TABLA = 100;

function slugSector(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fechaMadrid(fecha = new Date()) {
  return new Date(fecha).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calcularCiclos(senales, precioActual, limite = MAX_SENALES_TABLA) {
  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const limitada = lista.slice(-limite);

  return limitada.map((s, i) => {
    const siguiente = limitada[i + 1];
    const precioCierre = siguiente ? siguiente.precio : precioActual;
    const variacion = precioCierre ? ((precioCierre - s.precio) / s.precio) * 100 : 0;

    let acierto = null;
    if (variacion !== 0) {
      if (s.tipo === 'compra') acierto = variacion > 0;
      else if (s.tipo === 'venta') acierto = variacion < 0;
    }

    return { tipo: s.tipo, variacion, acierto };
  });
}

function calcularOportunidad(zona, percentil) {
  if (zona === 'intermedia') {
    return { nivel: 'baja', color: 'var(--v3-text-soft)' };
  }
  const extremoBajo = percentil <= 5 || percentil >= 95;
  const extremo = percentil <= 15 || percentil >= 85;
  if (extremoBajo) return { nivel: 'muy alta', color: 'var(--v3-negative)' };
  if (extremo) return { nivel: 'alta', color: 'var(--v3-warn)' };
  return { nivel: 'media', color: 'var(--v3-text-soft)' };
}

function calcularFuturo(smis, velas, smiActual) {
  if (!Array.isArray(smis) || smis.length < 5) return null;
  if (!Array.isArray(velas) || velas.length < 5) return null;
  if (typeof smiActual !== 'number' || isNaN(smiActual)) return null;

  const validos = smis.filter((v) => v !== null && v !== undefined && !isNaN(v));
  if (validos.length < 2) return null;

  const ultimo = validos[validos.length - 1];
  const anterior = validos[validos.length - 2];
  const direccionActual =
    ultimo > anterior ? 'subiendo' : ultimo < anterior ? 'bajando' : 'plana';
  if (direccionActual === 'plana') return null;

  const casos = [];

  for (let i = 0; i < smis.length - 2; i++) {
    const smi = smis[i];
    if (smi === null || smi === undefined || isNaN(smi)) continue;
    if (Math.abs(smi - smiActual) > 10) continue;

    let prevValido = null;
    for (let k = i - 1; k >= 0; k--) {
      if (smis[k] !== null && smis[k] !== undefined && !isNaN(smis[k])) {
        prevValido = smis[k];
        break;
      }
    }
    if (prevValido === null || prevValido === smi) continue;

    const dirSesion = smi > prevValido ? 'subiendo' : 'bajando';
    if (dirSesion !== direccionActual) continue;

    let sesionesGiro = null;
    let fechaGiro = null;
    let direccionGiro = null;

    for (let j = i + 1; j < smis.length; j++) {
      if (smis[j] === null || smis[j] === undefined || isNaN(smis[j])) continue;

      let prevJ = null;
      for (let k = j - 1; k >= 0; k--) {
        if (smis[k] !== null && smis[k] !== undefined && !isNaN(smis[k])) {
          prevJ = smis[k];
          break;
        }
      }
      if (prevJ === null || prevJ === smis[j]) continue;

      const dirJ = smis[j] > prevJ ? 'subiendo' : 'bajando';
      if (dirJ !== dirSesion) {
        if (velas[i] && velas[j] && velas[i].date && velas[j].date) {
          sesionesGiro = j - i;
          fechaGiro = velas[j].date;
          direccionGiro = dirJ;
        }
        break;
      }
    }

    if (sesionesGiro !== null) {
      casos.push({
        fecha: velas[i]?.date || '',
        fechaGiro,
        smi,
        sesiones: sesionesGiro,
        direccionGiro
      });
    }
  }

  if (casos.length === 0) {
    return {
      direccionActual,
      casos: [],
      ultimoCaso: null,
      mediaSesiones: null
    };
  }

  const mediaSesiones = casos.reduce((a, c) => a + c.sesiones, 0) / casos.length;

  return {
    direccionActual,
    casos,
    ultimoCaso: casos[casos.length - 1],
    mediaSesiones
  };
}

async function cargarConsenso(ticker) {
  try {
    const { data } = await supabaseAdmin
      .from('votos')
      .select('opcion')
      .eq('ticker', ticker.toUpperCase());

    if (!data || data.length === 0) {
      return { total: 0, sentimiento: null, conteo: { seguimiento: 0, cartera: 0, fuera: 0 } };
    }

    const conteo = { seguimiento: 0, cartera: 0, fuera: 0 };
    for (const v of data) {
      if (conteo[v.opcion] !== undefined) conteo[v.opcion]++;
    }
    const total = conteo.seguimiento + conteo.cartera + conteo.fuera;
    let sentimiento = null;
    if (total > 0) {
      const max = Math.max(conteo.seguimiento, conteo.cartera, conteo.fuera);
      if (conteo.seguimiento === max) sentimiento = 'mayoritariamente en seguimiento';
      else if (conteo.cartera === max) sentimiento = 'mayoritariamente en cartera';
      else sentimiento = 'mayoritariamente fuera';
    }
    return { total, sentimiento, conteo };
  } catch (e) {
    return { total: 0, sentimiento: null, conteo: { seguimiento: 0, cartera: 0, fuera: 0 } };
  }
}

export async function generateMetadata({ params }) {
  const slug = params.slug;
  let ticker;
  if (slug.includes('__')) ticker = slug.split('__')[0].toUpperCase();
  else ticker = slug.split('-')[0].toUpperCase();

  try {
    const empresa = await obtenerOCrearEmpresa(ticker);
    if (!empresa) return { title: 'Empresa — Equaty' };

    const fecha = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
    const titulo = `Análisis técnico y estadístico de ${empresa.nombre} (${empresa.ticker}) — Actualizado ${fecha}`;
    const descripcion = `Informe estadístico de ${empresa.nombre} (${empresa.ticker}): indicador propio, zonas, histórico de movimientos y estadística. No es recomendación de inversión.`;
    const canonical = `${BASE_URL}/analisis/${slug}`;

    return {
      title: titulo,
      description: descripcion,
      alternates: { canonical },
      openGraph: {
        title: titulo,
        description: descripcion,
        url: canonical,
        siteName: 'Equaty',
        type: 'article',
        locale: 'es_ES'
      },
      twitter: {
        card: 'summary_large_image',
        title: titulo,
        description: descripcion
      }
    };
  } catch (e) {
    return { title: 'Empresa — Equaty' };
  }
}

export default async function PaginaEmpresa({ params }) {
  const slug = params.slug;

  let ticker;
  if (slug.includes('__')) ticker = slug.split('__')[0].toUpperCase();
  else ticker = slug.split('-')[0].toUpperCase();

  let empresa = null;
  try {
    empresa = await obtenerOCrearEmpresa(ticker);
  } catch (e) {
    console.error('Error empresa:', e.message);
  }

  if (!empresa) {
    return (
      <div
        className="v3-container"
        style={{ maxWidth: '700px', textAlign: 'center', paddingTop: '80px' }}
      >
        <meta httpEquiv="refresh" content="3" />
        <h1>{ticker}</h1>
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '20px', fontSize: '17px' }}>
          Cargando empresa por primera vez…
        </p>
        <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '12px' }}>
          Esto solo ocurre la primera vez. Unos segundos.
        </p>
      </div>
    );
  }

  let analisis = null;
  let desdeCache = false;
  try {
    const resultado = await obtenerAnalisis(ticker, empresa);
    analisis = resultado.analisis;
    desdeCache = resultado.desdeCache;
  } catch (e) {
    console.error('Error análisis:', e.message);
  }

  if (!analisis) {
    return (
      <div
        className="v3-container"
        style={{ maxWidth: '700px', textAlign: 'center', paddingTop: '80px' }}
      >
        <meta httpEquiv="refresh" content="3" />
        <h1>
          {empresa.nombre} ({empresa.ticker})
        </h1>
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '20px', fontSize: '17px' }}>
          Cargando análisis por primera vez…
        </p>
        <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '12px' }}>
          Esto solo ocurre la primera vez. Unos segundos.
        </p>
      </div>
    );
  }

  const canonical = `${BASE_URL}/analisis/${slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Análisis técnico y estadístico de ${empresa.nombre} (${empresa.ticker})`,
    description: `Informe estadístico de ${empresa.nombre}`,
    url: canonical,
    datePublished: analisis.generado_at,
    dateModified: analisis.generado_at,
    author: { '@type': 'Organization', name: 'Equaty' },
    publisher: { '@type': 'Organization', name: 'Equaty' },
    about: {
      '@type': 'FinancialProduct',
      name: empresa.nombre,
      identifier: empresa.ticker
    }
  };

  // Cálculos
  const ciclos = calcularCiclos(analisis.senales || [], analisis.precioActual);
  const compras = ciclos.filter((c) => c.tipo === 'compra');
  const ventas = ciclos.filter((c) => c.tipo === 'venta');

  function analizarEstadistica(lista) {
    let aciertos = 0;
    let total = 0;
    for (const c of lista) {
      if (c.acierto === null) continue;
      total++;
      if (c.acierto) aciertos++;
    }
    const porcentaje = total > 0 ? (aciertos / total) * 100 : 0;
    return {
      muestra: lista.length,
      aciertos,
      fallos: total - aciertos,
      porcentajeAcierto: porcentaje
    };
  }

  const statsCompras = analizarEstadistica(compras);
  const statsVentas = analizarEstadistica(ventas);

  const velas = analisis.velasUltimas60 || [];
  const smis = analisis.smisUltimos60 || [];

  const precioActual = analisis.precioActual;
  const precio5Atras = velas.length >= 6 ? velas[velas.length - 6].close : precioActual;
  const variacion5 = precio5Atras
    ? ((precioActual - precio5Atras) / precio5Atras) * 100
    : 0;

  const smisValidos = smis.filter((v) => v !== null && v !== undefined);
  const smisOrdenados = [...smisValidos].sort((a, b) => a - b);
  let percentil = 0;
  if (smisOrdenados.length > 0) {
    const menores = smisOrdenados.filter((v) => v < analisis.smiActual).length;
    percentil = Math.round((menores / smisOrdenados.length) * 100);
  }

  const colorZona =
    analisis.zona === 'alta'
      ? 'var(--v3-negative)'
      : analisis.zona === 'baja'
      ? 'var(--v3-positive)'
      : 'var(--v3-text-soft)';

  const oportunidad = calcularOportunidad(analisis.zona, percentil);
  const futuro = calcularFuturo(smis, velas, analisis.smiActual);
  const consenso = await cargarConsenso(empresa.ticker);

  const senales = analisis.senales || [];
  const ultimaSenal = senales.length > 0 ? senales[senales.length - 1] : null;
  const ultimaSenalAbierta = analisis.posicionAbierta;

  const colorUltimoMovimiento =
    ultimaSenal?.tipo === 'compra' ? 'var(--v3-positive)' : 'var(--v3-negative)';

  // Interpretación del gráfico
  const primerCierre = velas[0]?.close;
  const ultimoCierre = velas[velas.length - 1]?.close;
  const variacion60 = primerCierre
    ? ((ultimoCierre - primerCierre) / primerCierre) * 100
    : 0;
  const maximo = velas.length > 0 ? Math.max(...velas.map((v) => v.high)) : 0;
  const minimo = velas.length > 0 ? Math.min(...velas.map((v) => v.low)) : 0;

  const retornos = [];
  for (let i = 1; i < velas.length; i++) {
    retornos.push((velas[i].close - velas[i - 1].close) / velas[i - 1].close);
  }
  const media = retornos.length > 0 ? retornos.reduce((a, b) => a + b, 0) / retornos.length : 0;
  const varianza =
    retornos.length > 0
      ? retornos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / retornos.length
      : 0;
  const volatilidad = Math.sqrt(varianza) * 100;

  let enAlta = 0;
  let enMedia = 0;
  let enBaja = 0;
  for (const s of smis) {
    if (s === null || s === undefined) continue;
    if (s > 40) enAlta++;
    else if (s < -40) enBaja++;
    else enMedia++;
  }
  const totalSesiones = enAlta + enMedia + enBaja;

  const tipoGiroTexto =
    futuro && futuro.ultimoCaso
      ? futuro.ultimoCaso.direccionGiro === 'subiendo'
        ? 'compra'
        : 'venta'
      : null;

  return (
    <div className="v3-grid-analisis">
      <main>
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <RegistrarVisita ticker={empresa.ticker} ruta={`/analisis/${slug}`} />

        <nav
          aria-label="Migas de pan"
          style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginBottom: '16px' }}
        >
          <Link href="/" style={{ color: 'var(--v3-text-soft)' }}>
            Inicio
          </Link>
          {' > '}
          <Link
            href={empresa.sector ? `/sectores/${slugSector(empresa.sector)}` : '/sectores'}
            style={{ color: 'var(--v3-text-soft)' }}
          >
            {empresa.sector || 'Sector'}
          </Link>
          {' > '}
          <span style={{ color: 'var(--v3-text)' }}>{empresa.nombre}</span>
        </nav>

        <h1>
          Análisis técnico y estadístico de {empresa.nombre} ({empresa.ticker})
        </h1>

        <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
          Última actualización: {fechaMadrid()}
          {desdeCache && ' · desde caché'}
        </p>

        <div className="v3-aviso">
          Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
          recomendación de inversión.
        </div>

        {/* BLOQUE 1: Datos de la empresa */}
        <section className="v3-seccion" style={{ marginTop: '20px' }}>
          <h2 className="v3-seccion-titulo">Datos de la empresa</h2>
          <div className="v3-card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px'
              }}
            >
              <Dato etiqueta="Ticker" valor={empresa.ticker} />
              <Dato etiqueta="Sector" valor={empresa.sector || '—'} />
              <Dato etiqueta="Mercado" valor={empresa.mercado || '—'} />
              <Dato
                etiqueta="Precio actual"
                valor={precioActual?.toFixed(2) ?? '—'}
                extra={`${variacion5 >= 0 ? '+' : ''}${variacion5.toFixed(2)}% en 5 sesiones`}
                colorExtra={variacion5 >= 0 ? 'var(--v3-positive)' : 'var(--v3-negative)'}
              />
            </div>
          </div>
        </section>

        {/* BLOQUE 2: Indicador propio */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Indicador propio</h2>
          <div className="v3-card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px'
              }}
            >
              <Dato
                etiqueta="Valor"
                valor={analisis.smiActual?.toFixed(2) ?? '—'}
                extra="Escala -100 a +100"
              />
              <Dato etiqueta="Zona" valor={analisis.zona} colorValor={colorZona} />
              <Dato etiqueta="Percentil" valor={percentil} extra="Posición en 60 sesiones" />
              <Dato
                etiqueta="Oportunidad de giro"
                valor={oportunidad.nivel}
                colorValor={oportunidad.color}
              />
            </div>

            <p
              style={{
                margin: '20px 0 0 0',
                fontSize: '14px',
                color: 'var(--v3-text)',
                lineHeight: 1.7
              }}
            >
              El <strong>valor</strong> mide en qué punto del rango reciente está el precio, en una
              escala de -100 a +100. La <strong>zona</strong> indica si ese valor está en la parte
              alta (por encima de +40), intermedia (entre -40 y +40) o baja (por debajo de -40). El{' '}
              <strong>percentil</strong> señala la posición de ese valor dentro de las últimas 60
              sesiones: 0 es el mínimo y 100 el máximo. La <strong>oportunidad de giro</strong>{' '}
              combina la zona y el percentil para indicar cuándo, históricamente, los giros han
              sido más frecuentes.
            </p>
          </div>
        </section>

        {/* BLOQUE 3: Último movimiento */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Último movimiento registrado</h2>
          <div className="v3-card" style={{ padding: '20px' }}>
            {ultimaSenal ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: colorUltimoMovimiento,
                      textTransform: 'capitalize'
                    }}
                  >
                    {ultimaSenal.tipo}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--v3-text-soft)' }}>
                    {ultimaSenal.fecha}
                    {ultimaSenalAbierta && ' · en curso'}
                  </div>
                </div>
                <p
                  style={{
                    margin: '12px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--v3-text-mute)'
                  }}
                >
                  Puedes ver todos los movimientos registrados en la tabla inferior.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--v3-text-soft)' }}>
                Sin movimientos registrados en el último año.
              </p>
            )}
          </div>
        </section>

        {/* BLOQUE 4: Futuro estadístico + aciertos */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Futuro estadístico</h2>

          {futuro && <TarjetaFuturo futuro={futuro} />}

          <div className="v3-card" style={{ padding: '20px', marginTop: '16px' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>
              Nuestros aciertos estadísticos en {empresa.nombre}
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginTop: '12px'
              }}
            >
              <div>
                <div
                  style={{
                    color: 'var(--v3-text-mute)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}
                >
                  Movimientos de compra
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color:
                      statsCompras.porcentajeAcierto >= 50
                        ? 'var(--v3-positive)'
                        : 'var(--v3-negative)'
                  }}
                >
                  {statsCompras.muestra > 0
                    ? `${statsCompras.porcentajeAcierto.toFixed(1)}%`
                    : '—'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--v3-text-soft)', marginTop: '4px' }}>
                  {statsCompras.aciertos} aciertos / {statsCompras.fallos} fallos ·{' '}
                  {statsCompras.muestra} ciclos
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: 'var(--v3-text-mute)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}
                >
                  Movimientos de venta
                </div>
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color:
                      statsVentas.porcentajeAcierto >= 50
                        ? 'var(--v3-positive)'
                        : 'var(--v3-negative)'
                  }}
                >
                  {statsVentas.muestra > 0
                    ? `${statsVentas.porcentajeAcierto.toFixed(1)}%`
                    : '—'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--v3-text-soft)', marginTop: '4px' }}>
                  {statsVentas.aciertos} aciertos / {statsVentas.fallos} fallos ·{' '}
                  {statsVentas.muestra} ciclos
                </div>
              </div>
            </div>

            {(statsCompras.muestra < 10 || statsVentas.muestra < 10) && (
              <p style={{ color: 'var(--v3-negative)', fontSize: '13px', marginTop: '12px' }}>
                Muestra limitada en alguno de los tipos de movimiento. Interpretar con cautela.
              </p>
            )}

            <p
              style={{
                margin: '16px 0 0 0',
                fontSize: '12px',
                color: 'var(--v3-text-mute)',
                lineHeight: 1.5
              }}
            >
              Estos datos proceden del gráfico y de la tabla de movimientos que aparecen más abajo.
            </p>
          </div>
        </section>

        <p className="v3-aviso-mute">
          Este análisis se elabora de forma independiente a las circunstancias personales de cada
          lector. No constituye asesoramiento financiero personalizado.
        </p>

        <ConsensoComunidad ticker={empresa.ticker} />

        <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />

        {/* Interpretación del gráfico: párrafos cortos, datos en negrita */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Interpretación del gráfico</h2>
          <div className="v3-card" style={{ lineHeight: 1.75 }}>
            <p style={{ marginTop: 0, fontSize: '14px', color: 'var(--v3-text)' }}>
              En las últimas 60 sesiones, <strong>{empresa.nombre}</strong> ha pasado de{' '}
              <strong>{primerCierre?.toFixed(2)}</strong> a{' '}
              <strong>{ultimoCierre?.toFixed(2)}</strong>, con una variación del{' '}
              <strong
                style={{
                  color: variacion60 >= 0 ? 'var(--v3-positive)' : 'var(--v3-negative)'
                }}
              >
                {variacion60 >= 0 ? '+' : ''}
                {variacion60.toFixed(2)}%
              </strong>
              . El rango de cotización se ha movido entre un mínimo de{' '}
              <strong>{minimo.toFixed(2)}</strong> y un máximo de{' '}
              <strong>{maximo.toFixed(2)}</strong>, y la volatilidad diaria media ha sido del{' '}
              <strong>{volatilidad.toFixed(2)}%</strong>.
            </p>

            <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
              De las <strong>{totalSesiones}</strong> sesiones analizadas, el indicador ha estado{' '}
              <strong>{enAlta}</strong> en zona alta, <strong>{enMedia}</strong> en zona
              intermedia y <strong>{enBaja}</strong> en zona baja. Estas son las zonas en las que,
              estadísticamente, el precio ha cotizado más caro o más barato de lo habitual dentro
              de su propio rango reciente.
            </p>

            <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
              Actualmente el indicador se encuentra en un valor de{' '}
              <strong>{analisis.smiActual?.toFixed(2)}</strong>, dentro de la{' '}
              <strong style={{ color: colorZona }}>zona {analisis.zona}</strong>, con un percentil{' '}
              <strong>{percentil}</strong> sobre las últimas 60 sesiones y una oportunidad de giro{' '}
              <strong style={{ color: oportunidad.color }}>{oportunidad.nivel}</strong>.
            </p>

            {ultimaSenal && (
              <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
                El último movimiento registrado fue de{' '}
                <strong style={{ color: colorUltimoMovimiento }}>{ultimaSenal.tipo}</strong> el{' '}
                <strong>{ultimaSenal.fecha}</strong>
                {ultimaSenalAbierta ? ', y sigue en curso' : ''}.
              </p>
            )}

            {futuro && futuro.ultimoCaso && tipoGiroTexto && (
              <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
                La última vez que el indicador estuvo en un valor similar (±10 puntos) mientras{' '}
                {futuro.direccionActual === 'subiendo' ? 'subía' : 'bajaba'} fue el{' '}
                <strong>
                  {new Date(futuro.ultimoCaso.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Europe/Madrid'
                  })}
                </strong>
                , y tardó{' '}
                <strong style={{ color: 'var(--v3-negative)' }}>
                  {futuro.ultimoCaso.sesiones}{' '}
                  {futuro.ultimoCaso.sesiones === 1 ? 'sesión' : 'sesiones'}
                </strong>{' '}
                en dar <strong>{tipoGiroTexto}</strong> de nuevo. La media de las{' '}
                <strong>{futuro.casos.length}</strong>{' '}
                {futuro.casos.length === 1 ? 'ocasión' : 'ocasiones'} similares en las últimas 60
                sesiones es de{' '}
                <strong>
                  {futuro.mediaSesiones.toFixed(1)}{' '}
                  {futuro.mediaSesiones === 1 ? 'sesión' : 'sesiones'}
                </strong>
                .
              </p>
            )}

            {(statsCompras.muestra > 0 || statsVentas.muestra > 0) && (
              <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
                En cuanto a nuestros aciertos estadísticos,
                {statsCompras.muestra > 0 && (
                  <>
                    {' '}
                    en los movimientos de compra el porcentaje de acierto es del{' '}
                    <strong
                      style={{
                        color:
                          statsCompras.porcentajeAcierto >= 50
                            ? 'var(--v3-positive)'
                            : 'var(--v3-negative)'
                      }}
                    >
                      {statsCompras.porcentajeAcierto.toFixed(1)}%
                    </strong>{' '}
                    (<strong>{statsCompras.aciertos}</strong> aciertos y{' '}
                    <strong>{statsCompras.fallos}</strong> fallos sobre{' '}
                    <strong>{statsCompras.muestra}</strong> ciclos)
                  </>
                )}
                {statsCompras.muestra > 0 && statsVentas.muestra > 0 && ';'}
                {statsVentas.muestra > 0 && (
                  <>
                    {' '}
                    en los movimientos de venta el porcentaje de acierto es del{' '}
                    <strong
                      style={{
                        color:
                          statsVentas.porcentajeAcierto >= 50
                            ? 'var(--v3-positive)'
                            : 'var(--v3-negative)'
                      }}
                    >
                      {statsVentas.porcentajeAcierto.toFixed(1)}%
                    </strong>{' '}
                    (<strong>{statsVentas.aciertos}</strong> aciertos y{' '}
                    <strong>{statsVentas.fallos}</strong> fallos sobre{' '}
                    <strong>{statsVentas.muestra}</strong> ciclos)
                  </>
                )}
                .
              </p>
            )}

            {consenso && consenso.total > 0 && (
              <p style={{ fontSize: '14px', color: 'var(--v3-text)', marginBottom: 0 }}>
                El consenso de la comunidad muestra <strong>{consenso.total}</strong>{' '}
                {consenso.total === 1 ? 'voto' : 'votos'} registrados, con un sentimiento{' '}
                <strong>{consenso.sentimiento}</strong>.
              </p>
            )}
          </div>
        </section>

        <TablaSenales senales={analisis.senales} precioActual={analisis.precioActual} />

        <ComparadorSector empresa={empresa} analisis={analisis} />

        {analisis.noticias && analisis.noticias.length > 0 && (
          <ContextoReciente noticias={analisis.noticias} />
        )}

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Sobre {empresa.nombre}</h2>
          <p style={{ lineHeight: 1.7 }}>
            {empresa.nombre} ({empresa.ticker}) cotiza en{' '}
            {empresa.mercado || 'mercado no especificado'} y pertenece al sector{' '}
            {empresa.sector || 'sector no especificado'}. La información utilizada en este informe
            procede de series históricas públicas de mercado y se revisa periódicamente por el
            equipo de Equaty.
          </p>
        </section>

        <BotonesCompartir empresa={empresa} analisis={analisis} url={canonical} />

        <p className="v3-aviso-mute" style={{ marginTop: '20px' }}>
          Este registro se basa exclusivamente en datos históricos y no garantiza ningún resultado
          futuro. El usuario debe tomar sus propias decisiones de inversión.
        </p>
      </main>

      <div className="v3-sidebar">
        <BarraLateral ticker={empresa.ticker} />
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor, extra, colorValor, colorExtra }) {
  return (
    <div>
      <div
        style={{
          color: 'var(--v3-text-mute)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          marginBottom: '4px'
        }}
      >
        {etiqueta}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: colorValor || 'var(--v3-text)',
          lineHeight: 1.2,
          wordBreak: 'break-word'
        }}
      >
        {valor}
      </div>
      {extra && (
        <div
          style={{
            fontSize: '12px',
            marginTop: '4px',
            color: colorExtra || 'var(--v3-text-soft)'
          }}
        >
          {extra}
        </div>
      )}
    </div>
  );
}

function TarjetaFuturo({ futuro }) {
  const { direccionActual, casos, ultimoCaso, mediaSesiones } = futuro;

  if (!casos || casos.length === 0) {
    return (
      <div
        className="v3-card"
        style={{
          padding: '16px',
          borderLeft: '4px solid var(--v3-border-strong)'
        }}
      >
        <div
          style={{
            color: 'var(--v3-text-mute)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            marginBottom: '6px'
          }}
        >
          Última situación similar
        </div>
        <p style={{ margin: 0, color: 'var(--v3-text-soft)', fontSize: '14px' }}>
          Sin datos suficientes en las últimas 60 sesiones. El indicador no ha pasado antes por un
          valor similar (±10 puntos) mientras{' '}
          {direccionActual === 'subiendo' ? 'subía' : 'bajaba'}.
        </p>
      </div>
    );
  }

  const fechaUltimo = new Date(ultimoCaso.fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  });

  const tipoGiro = ultimoCaso.direccionGiro === 'subiendo' ? 'compra' : 'venta';

  return (
    <div
      className="v3-card"
      style={{
        padding: '20px',
        borderLeft: '4px solid var(--v3-negative)'
      }}
    >
      <div
        style={{
          color: 'var(--v3-text-mute)',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          marginBottom: '8px'
        }}
      >
        Última situación similar
      </div>

      <p style={{ margin: 0, fontSize: '14px', color: 'var(--v3-text-soft)', lineHeight: 1.6 }}>
        El indicador está ahora <strong>{direccionActual}</strong>. En las últimas 60 sesiones ha
        estado en un valor similar (±10 puntos) mientras iba en la misma dirección en{' '}
        <strong>{casos.length}</strong> {casos.length === 1 ? 'ocasión' : 'ocasiones'}.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          marginTop: '12px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--v3-text-soft)' }}>
          La última vez ({fechaUltimo}), tardó
        </span>
        <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--v3-negative)' }}>
          {ultimoCaso.sesiones}
        </span>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--v3-negative)' }}>
          {ultimoCaso.sesiones === 1 ? 'sesión' : 'sesiones'}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--v3-text-soft)' }}>
          en dar <strong>{tipoGiro}</strong> de nuevo.
        </span>
      </div>

      {casos.length > 1 && (
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--v3-text-soft)' }}>
          Media de las {casos.length} ocasiones:{' '}
          <strong>
            {mediaSesiones.toFixed(1)} {mediaSesiones === 1 ? 'sesión' : 'sesiones'}
          </strong>
          .
        </p>
      )}
    </div>
  );
}
