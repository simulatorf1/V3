import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import Link from 'next/link';
import Grafico from '../../../components/Grafico';
import GraficoSemanal from '../../../components/GraficoSemanal';
import ContextoReciente from '../../../components/ContextoReciente';
import RegistrarVisita from '../../../components/RegistrarVisita';
import BotonesCompartir from '../../../components/BotonesCompartir';
import ConsensoComunidad from '../../../components/ConsensoComunidad';
import FormularioAlerta from '../../../components/FormularioAlerta';
import Comparador from '../../../components/Comparador';
import WatchlistBoton from '../../../components/WatchlistBoton';
import ContextoSector from '../../../components/ContextoSector';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = 'https://equaty.es';

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta del rango';
  if (zona === 'baja') return 'parte baja del rango';
  return 'parte intermedia del rango';
}

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
  if (sesiones >= velas.length - 1) primero = velas[0]?.close;
  else primero = velas[velas.length - sesiones - 1]?.close;
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

async function cargarContextoSector(tickerActual, sector) {
  if (!sector) return { ranking: [], cambiosZona: [], extremosAltos: [], extremosBajos: [] };

  try {
    const { data: empresasSector } = await supabaseAdmin
      .from('empresas')
      .select('ticker, nombre, sector')
      .eq('sector', sector);

    if (!empresasSector || empresasSector.length === 0) {
      return { ranking: [], cambiosZona: [], extremosAltos: [], extremosBajos: [] };
    }

    const tickersSector = empresasSector.map((e) => e.ticker);
    const empresasMap = {};
    for (const e of empresasSector) empresasMap[e.ticker] = e;

    const { data: paginas } = await supabaseAdmin
      .from('paginas')
      .select('ticker, datos')
      .in('ticker', tickersSector);

    const items = [];
    for (const p of paginas || []) {
      const datos = parseDatos(p.datos);
      if (!datos) continue;
      const velas = datos.velasUltimas60 || [];
      const smis = datos.smisUltimos60 || [];
      const v60 = calcularVariacion(velas, 60);
      const percentil = calcularPercentil(smis, datos.smiActual);
      items.push({
        ticker: p.ticker,
        nombre: empresasMap[p.ticker]?.nombre || p.ticker,
        variacion60: v60,
        percentil,
        zona: datos.zona || null
      });
    }

    const ranking = items
      .filter((i) => i.variacion60 !== null)
      .sort((a, b) => b.variacion60 - a.variacion60)
      .slice(0, 15);

    const extremosAltos = items
      .filter((i) => i.percentil !== null && i.percentil >= 90)
      .sort((a, b) => b.percentil - a.percentil)
      .slice(0, 8);

    const extremosBajos = items
      .filter((i) => i.percentil !== null && i.percentil <= 10)
      .sort((a, b) => a.percentil - b.percentil)
      .slice(0, 8);

    const hace7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cambiosRaw } = await supabaseAdmin
      .from('cambios_movimiento')
      .select('ticker, movimiento_anterior, movimiento_nuevo, detectado_at')
      .gte('detectado_at', hace7d)
      .in('ticker', tickersSector)
      .order('detectado_at', { ascending: false })
      .limit(20);

    const cambiosZona = (cambiosRaw || []).map((c) => ({
      ticker: c.ticker,
      nombre: empresasMap[c.ticker]?.nombre || c.ticker,
      categoriaAnterior:
        c.movimiento_anterior === 'venta' ? 'A' : c.movimiento_anterior === 'compra' ? 'C' : 'B',
      categoriaNueva:
        c.movimiento_nuevo === 'venta' ? 'A' : c.movimiento_nuevo === 'compra' ? 'C' : 'B'
    }));

    return { ranking, cambiosZona, extremosAltos, extremosBajos };
  } catch (e) {
    console.error('[contextoSector] Error:', e.message);
    return { ranking: [], cambiosZona: [], extremosAltos: [], extremosBajos: [] };
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
    const titulo = `${empresa.nombre} (${empresa.ticker}) — Precio, evolución y rango | Equaty`;
    const descripcion = `Ficha estadística descriptiva de ${empresa.nombre} (${empresa.ticker}) actualizada el ${fecha}: precio actual, variación en 60 sesiones, comparación sectorial e indicador Equaty. Información histórica, no recomendación de inversión.`;
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
        locale: 'es_ES',
        images: [
          {
            url: `${BASE_URL}/og-image.png`,
            width: 1200,
            height: 630,
            alt: `${empresa.nombre} (${empresa.ticker}) — Ficha estadística descriptiva`
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: titulo,
        description: descripcion,
        images: [`${BASE_URL}/og-image.png`]
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
      <div className="v3-container" style={{ maxWidth: '700px', textAlign: 'center', paddingTop: '80px' }}>
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
      <div className="v3-container" style={{ maxWidth: '700px', textAlign: 'center', paddingTop: '80px' }}>
        <meta httpEquiv="refresh" content="3" />
        <h1>{empresa.nombre} ({empresa.ticker})</h1>
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
    '@graph': [
      {
        '@type': 'Dataset',
        name: `Ficha estadística de ${empresa.nombre} (${empresa.ticker})`,
        description: `Datos históricos de precio, variación y posición en el rango de las últimas 60 sesiones de ${empresa.nombre}.`,
        url: canonical,
        creator: { '@type': 'Organization', name: 'Equaty', url: BASE_URL },
        datePublished: analisis.generado_at,
        dateModified: analisis.generado_at,
        license: `${BASE_URL}/terminos`,
        isAccessibleForFree: true
      },
      {
        '@type': 'FinancialProduct',
        name: empresa.nombre,
        identifier: empresa.ticker,
        category: empresa.sector || undefined,
        url: canonical
      },
      {
        '@type': 'Article',
        headline: `Ficha estadística de ${empresa.nombre} (${empresa.ticker})`,
        description: `Información descriptiva de ${empresa.nombre}`,
        url: canonical,
        datePublished: analisis.generado_at,
        dateModified: analisis.generado_at,
        author: { '@type': 'Organization', name: 'Equaty' },
        publisher: { '@type': 'Organization', name: 'Equaty' }
      }
    ]
  };

  const velas = analisis.velasUltimas60 || [];
  const smis = analisis.smisUltimos60 || [];

  const precioActual = analisis.precioActual;
  const precio5Atras = velas.length >= 6 ? velas[velas.length - 6].close : precioActual;
  const variacion5 = precio5Atras ? ((precioActual - precio5Atras) / precio5Atras) * 100 : 0;

  const smisValidos = smis.filter((v) => v !== null && v !== undefined);
  const smisOrdenados = [...smisValidos].sort((a, b) => a - b);
  let percentil = 0;
  if (smisOrdenados.length > 0) {
    const menores = smisOrdenados.filter((v) => v < analisis.smiActual).length;
    percentil = Math.round((menores / smisOrdenados.length) * 100);
  }

  const situacionActual = situacionDesdeZona(analisis.zona);
  const consenso = await cargarConsenso(empresa.ticker);

  const primerCierre = velas[0]?.close;
  const ultimoCierre = velas[velas.length - 1]?.close;
  const variacion60 = primerCierre ? ((ultimoCierre - primerCierre) / primerCierre) * 100 : 0;

  const contexto = await cargarContextoSector(empresa.ticker, empresa.sector);

  const estiloAcordeon = {
    marginTop: '16px',
    border: '1px solid var(--v3-border)',
    borderRadius: 'var(--v3-radius-sm)',
    background: 'var(--v3-bg-soft)'
  };
  const estiloSummary = {
    cursor: 'pointer',
    padding: '14px 20px',
    fontWeight: 700,
    fontSize: '15px',
    listStyle: 'none'
  };

  return (
    <div className="v3-container">
      <link rel="canonical" href={canonical} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <RegistrarVisita ticker={empresa.ticker} ruta={`/analisis/${slug}`} />

      <nav
        aria-label="Migas de pan"
        style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginBottom: '12px' }}
      >
        <Link href="/" style={{ color: 'var(--v3-text-soft)' }}>Inicio</Link>
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

      <h1 style={{ marginBottom: '4px' }}>{empresa.nombre} ({empresa.ticker})</h1>

      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
        <WatchlistBoton ticker={empresa.ticker} nombre={empresa.nombre} />
      </div>

      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: 0 }}>
        {empresa.mercado || 'Mercado no especificado'}
        {empresa.sector && ` · Sector ${empresa.sector}`}
        {' · '}Última actualización: {fechaMadrid()}
        {desdeCache && ' · desde caché'}
      </p>

      <div className="v3-ficha-grid">
        <div>
          <section className="v3-seccion" style={{ marginTop: '20px' }}>
            <div className="v3-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, marginBottom: '4px' }}>
                {precioActual?.toFixed(2) ?? '—'} €
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--v3-text-soft)' }}>
                Precio actual · {empresa.mercado || ''}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Variación 5 sesiones
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    {variacion5 >= 0 ? '+' : ''}{variacion5.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Variación 60 sesiones
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    {variacion60 >= 0 ? '+' : ''}{variacion60.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Situación actual
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{situacionActual}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--v3-text-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Percentil 60
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{percentil}</div>
                </div>
              </div>

              <p style={{ margin: '8px 0 0 0', fontSize: '11.5px', color: 'var(--v3-text-mute)' }}>
                Datos históricos descriptivos. No predictivos. No constituyen recomendación de inversión.
              </p>
            </div>
          </section>

          <section className="v3-seccion">
            <h2 className="v3-seccion-titulo">Evolución del precio y del indicador Equaty</h2>
            <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />
          </section>

          {analisis.velasSemanales && analisis.velasSemanales.length > 0 && (
            <GraficoSemanal velas={analisis.velasSemanales} smis={analisis.smisSemanales || []} />
          )}

          <Comparador tickerActual={empresa.ticker} nombreActual={empresa.nombre} />

          {analisis.noticias && analisis.noticias.length > 0 && (
            <ContextoReciente noticias={analisis.noticias} />
          )}

          <details style={estiloAcordeon}>
            <summary style={estiloSummary}>Divulgación regulatoria y metodología</summary>
            <div style={{ padding: '0 20px 20px 20px', fontSize: '13px', lineHeight: 1.7 }}>
              <p style={{ marginTop: 0 }}>
                El contenido de esta página tiene <strong>finalidad exclusivamente estadística e
                informativa</strong>. No constituye asesoramiento financiero, recomendación de
                inversión, análisis financiero regulado, oferta ni solicitud de compra o venta de
                instrumentos financieros. Los datos mostrados se basan en información histórica de
                mercado y se presentan con carácter descriptivo. No existe capacidad predictiva
                demostrada: la evolución pasada no garantiza resultados futuros y no permite
                deducir probabilidades ni resultados futuros. El usuario debe tomar sus propias
                decisiones de inversión de forma independiente y, en su caso, consultar a un asesor
                financiero debidamente autorizado.
              </p>
              <p>
                <strong>Metodología.</strong> El indicador Equaty es un oscilador técnico que mide la distancia del precio al punto medio de su
                rango reciente y la suaviza. Se normaliza entre -100 y +100. Los valores cercanos a
                +100 indican que el precio se ha movido cerca del extremo superior de su rango
                reciente, y los cercanos a -100, cerca del extremo inferior. Los cálculos se
                realizan sobre velas diarias y semanales procedentes de series históricas públicas
                de mercado. No se utilizan previsiones, probabilidades ni escenarios futuros.
              </p>
              <p>
                <strong>Conflictos de interés.</strong> Equaty es una plataforma de contenido
                estadístico e informativo. No mantiene posiciones propias en los instrumentos
                financieros sobre los que publica fichas estadísticas, ni opera en los mercados con
                la finalidad de beneficiarse de la evolución de dichos instrumentos. No mantiene
                acuerdos comerciales con los emisores de los instrumentos analizados que pudieran
                influir en el contenido de las fichas. En caso de que existiera cualquier relación
                de este tipo, se haría constar de forma expresa y visible. La plataforma puede
                generar ingresos por publicidad, suscripciones o servicios de datos agregados, sin
                que estas fuentes condicionen la elaboración del contenido estadístico, que se rige
                por criterios descriptivos y neutrales. El contenido de esta ficha se elabora de
                forma independiente a las circunstancias personales de cada lector y no constituye
                asesoramiento financiero personalizado.
              </p>
            </div>
          </details>
        </div>

        <div>
          <ContextoSector
            tickerActual={empresa.ticker}
            sector={empresa.sector}
            ranking={contexto.ranking}
            cambiosZona={contexto.cambiosZona}
            extremosAltos={contexto.extremosAltos}
            extremosBajos={contexto.extremosBajos}
          />

          <section className="v3-seccion">
            <h2 className="v3-seccion-titulo">Avisos por email</h2>
            <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
              Te avisamos cuando esta empresa cambie de zona en su rango de 60 sesiones. Solo el
              dato, sin interpretación.
            </p>
            <FormularioAlerta empresa={empresa} />
          </section>

          <ConsensoComunidad ticker={empresa.ticker} />

          <BotonesCompartir empresa={empresa} analisis={analisis} url={canonical} />
        </div>
      </div>
    </div>
  );
}
