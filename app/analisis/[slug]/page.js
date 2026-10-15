import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Grafico from '../../../components/Grafico';
import ResumenVistazo from '../../../components/ResumenVistazo';
import ContextoReciente from '../../../components/ContextoReciente';
import ComparadorSector from '../../../components/ComparadorSector';
import TablaSenales from '../../../components/TablaSenales';
import RegistrarVisita from '../../../components/RegistrarVisita';
import BarraLateral from '../../../components/BarraLateral';
import BotonesCompartir from '../../../components/BotonesCompartir';

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

  // Cálculos de la estadística histórica
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

  // Interpretación del gráfico
  const velas = analisis.velasUltimas60 || [];
  const smis = analisis.smisUltimos60 || [];
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

        {/* Bloque 1: datos rápidos */}
        <h2 style={{ marginTop: '30px' }}>Datos rápidos</h2>
        <ul>
          <li>
            <strong>Ticker:</strong> {empresa.ticker}
          </li>
          <li>
            <strong>Sector:</strong> {empresa.sector || 'N/A'}
          </li>
          <li>
            <strong>Mercado:</strong> {empresa.mercado || 'N/A'}
          </li>
          <li>
            <strong>Precio actual:</strong> {analisis.precioActual?.toFixed(2)}
          </li>
          <li>
            <strong>Indicador propio:</strong> {analisis.smiActual?.toFixed(2)} (zona{' '}
            {analisis.zona})
          </li>
        </ul>

        <p className="v3-aviso-mute">
          Este análisis se elabora de forma independiente a las circunstancias personales de cada
          lector. No constituye asesoramiento financiero personalizado.
        </p>

        {/* Bloque 2: qué significa todo esto */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Qué significa todo esto</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
              marginTop: '12px'
            }}
          >
            <div className="v3-card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Indicador propio</div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--v3-text-soft)' }}>
                Mide en qué punto del rango reciente está el precio. Escala de -100 a +100.
              </p>
            </div>
            <div className="v3-card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Zona</div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--v3-text-soft)' }}>
                <strong>Alta</strong> (por encima de +40), <strong>intermedia</strong> (entre -40
                y +40) o <strong>baja</strong> (por debajo de -40).
              </p>
            </div>
            <div className="v3-card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Percentil</div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--v3-text-soft)' }}>
                Posición del valor actual dentro del rango de las últimas 60 sesiones. Del 0 al
                100.
              </p>
            </div>
            <div className="v3-card" style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Nivel de riesgo</div>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--v3-text-soft)' }}>
                Se calcula con la zona del indicador y su distancia a los extremos. No mide el
                riesgo de la empresa, solo el del momento estadístico.
              </p>
            </div>
          </div>
        </section>

        {/* Bloque 3: resumen de un vistazo (con consenso dentro) */}
        <ResumenVistazo analisis={analisis} empresa={empresa} />

        {/* Bloque 4: estadística histórica */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Estadística histórica</h2>
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
            Calculada sobre los mismos ciclos que aparecen en el histórico de movimientos.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}
          >
            <div className="v3-card">
              <h3 style={{ marginTop: 0 }}>Movimientos de compra</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.9 }}>
                <li>
                  <strong>Total:</strong> {statsCompras.muestra}
                </li>
                <li>
                  <strong>Aciertos:</strong> {statsCompras.aciertos}
                </li>
                <li>
                  <strong>Fallos:</strong> {statsCompras.fallos}
                </li>
                <li>
                  <strong>% acierto:</strong>{' '}
                  {statsCompras.muestra > 0 ? (
                    <span className="v3-pos">{statsCompras.porcentajeAcierto.toFixed(1)}%</span>
                  ) : (
                    '—'
                  )}
                </li>
              </ul>
            </div>
            <div className="v3-card">
              <h3 style={{ marginTop: 0 }}>Movimientos de venta</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.9 }}>
                <li>
                  <strong>Total:</strong> {statsVentas.muestra}
                </li>
                <li>
                  <strong>Aciertos:</strong> {statsVentas.aciertos}
                </li>
                <li>
                  <strong>Fallos:</strong> {statsVentas.fallos}
                </li>
                <li>
                  <strong>% acierto:</strong>{' '}
                  {statsVentas.muestra > 0 ? (
                    <span className="v3-pos">{statsVentas.porcentajeAcierto.toFixed(1)}%</span>
                  ) : (
                    '—'
                  )}
                </li>
              </ul>
            </div>
          </div>
          {(statsCompras.muestra < 10 || statsVentas.muestra < 10) && (
            <p style={{ color: 'var(--v3-negative)', fontSize: '13px', marginTop: '12px' }}>
              Muestra limitada en alguno de los tipos de movimiento. Interpretar con cautela.
            </p>
          )}
        </section>

        {/* Bloque 5: gráfico + interpretación */}
        <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Interpretación del gráfico</h2>
          <div className="v3-card" style={{ lineHeight: 1.75 }}>
            <p style={{ marginTop: 0 }}>
              En las últimas 60 sesiones, {empresa.nombre} ha pasado de {primerCierre?.toFixed(2)}{' '}
              a {ultimoCierre?.toFixed(2)}, con una variación del {variacion60 >= 0 ? '+' : ''}
              {variacion60.toFixed(2)}%. El rango de cotización se ha movido entre un mínimo de{' '}
              {minimo.toFixed(2)} y un máximo de {maximo.toFixed(2)}. La volatilidad diaria media
              ha sido del {volatilidad.toFixed(2)}%.
            </p>
            <p>
              De las {totalSesiones} sesiones analizadas, el indicador ha estado{' '}
              <strong>{enAlta} en zona alta</strong>, <strong>{enMedia} en zona intermedia</strong>{' '}
              y <strong>{enBaja} en zona baja</strong>. La zona intermedia es la más habitual en
              prácticamente cualquier empresa.
            </p>
            <p style={{ marginBottom: 0, color: 'var(--v3-text-soft)', fontSize: '13.5px' }}>
              Los tramos sombreados en rojo marcan las fases en las que el indicador ha
              sobresalido por encima de +40. Los tramos sombreados en verde, las fases en las que
              ha caído por debajo de -40. Estas zonas no predicen el siguiente movimiento,
              describen lo que ya ha pasado.
            </p>
          </div>
        </section>

        {/* Bloque 6: histórico de movimientos */}
        <TablaSenales senales={analisis.senales} precioActual={analisis.precioActual} />

        {/* Bloque 7: comparador sectorial */}
        <ComparadorSector empresa={empresa} analisis={analisis} />

        {/* Bloque 8: noticias (solo si hay) */}
        {analisis.noticias && analisis.noticias.length > 0 && (
          <ContextoReciente noticias={analisis.noticias} />
        )}

        {/* Bloque 9: sobre la empresa */}
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

        {/* Bloque 10: compartir */}
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
