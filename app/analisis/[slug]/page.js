import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import Link from 'next/link';
import Grafico from '../../../components/Grafico';
import GraficoSemanal from '../../../components/GraficoSemanal';
import ContextoReciente from '../../../components/ContextoReciente';
import ComparadorSector from '../../../components/ComparadorSector';
import TablaSenales from '../../../components/TablaSenales';
import RegistrarVisita from '../../../components/RegistrarVisita';
import BarraLateral from '../../../components/BarraLateral';
import BotonesCompartir from '../../../components/BotonesCompartir';
import ConsensoComunidad from '../../../components/ConsensoComunidad';
import MovimientosHoyCliente from '../../../components/MovimientosHoyCliente';
import FormularioAlerta from '../../../components/FormularioAlerta';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = 'https://equaty.es';

function situacionDesdeTipo(tipo) {
  if (tipo === 'compra') return 'parte baja del rango';
  if (tipo === 'venta') return 'parte alta del rango';
  return 'parte intermedia del rango';
}

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
    const titulo = `${empresa.nombre} (${empresa.ticker}) — Precio, evolución y rango | Equaty`;
    const descripcion = `Ficha estadística descriptiva de ${empresa.nombre} (${empresa.ticker}) actualizada el ${fecha}: precio actual, variación en 60 sesiones, comparación sectorial e indicador IBEXIA. Información histórica, no recomendación de inversión.`;
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

  const situacionActual = situacionDesdeZona(analisis.zona);

  const consenso = await cargarConsenso(empresa.ticker);

  const senales = analisis.senales || [];
  const ultimaSenal = senales.length > 0 ? senales[senales.length - 1] : null;

  const primerCierre = velas[0]?.close;
  const ultimoCierre = velas[velas.length - 1]?.close;
  const variacion60 = primerCierre
    ? ((ultimoCierre - primerCierre) / primerCierre) * 100
    : 0;

  const variacionSector60 =
    analisis.sectorInfo && analisis.sectorInfo.variacionSector60 !== null
      ? analisis.sectorInfo.variacionSector60
      : null;

  const estiloAcordeon = {
    marginTop: '20px',
    border: '1px solid var(--v3-border)',
    borderRadius: 'var(--v3-radius-sm)',
    background: 'var(--v3-bg-soft)'
  };
  const estiloSummary = {
    cursor: 'pointer',
    padding: '16px 20px',
    fontWeight: 700,
    fontSize: '15px',
    listStyle: 'none'
  };

  return (
    <div className="v3-grid-analisis">
      <main style={{ maxWidth: '780px', margin: '0 auto' }}>
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <RegistrarVisita ticker={empresa.ticker} ruta={`/analisis/${slug}`} />

        <nav
          aria-label="Migas de pan"
          style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginBottom: '12px' }}
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

        <h1 style={{ marginBottom: '4px' }}>
          {empresa.nombre} ({empresa.ticker})
        </h1>
        <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: 0 }}>
          {empresa.mercado || 'Mercado no especificado'}
          {empresa.sector && ` · Sector ${empresa.sector}`}
          {' · '}Última actualización: {fechaMadrid()}
          {desdeCache && ' · desde caché'}
        </p>

        {/* BARRAS: una por línea, escala fija centrada en cero */}
        <section className="v3-seccion" style={{ marginTop: '20px' }}>
          <div className="v3-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
              {precioActual?.toFixed(2) ?? '—'} €
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--v3-text-soft)' }}>
              Precio actual · {empresa.mercado || ''}
            </p>

            <BarraEscala
              etiqueta="Variación 5 sesiones"
              valor={variacion5}
              valorTexto={`${variacion5 >= 0 ? '+' : ''}${variacion5.toFixed(2)}%`}
              min={-15}
              max={15}
            />

            <div style={{ height: '12px' }} />

            <BarraEscala
              etiqueta="Variación 60 sesiones"
              valor={variacion60}
              valorTexto={`${variacion60 >= 0 ? '+' : ''}${variacion60.toFixed(2)}%`}
              min={-30}
              max={30}
            />

            <div style={{ height: '12px' }} />

            <BarraEscala
              etiqueta="Sector 60 sesiones"
              valor={variacionSector60}
              valorTexto={
                variacionSector60 !== null
                  ? `${variacionSector60 >= 0 ? '+' : ''}${variacionSector60.toFixed(2)}%`
                  : '—'
              }
              min={-15}
              max={15}
            />

            <div style={{ height: '12px' }} />

            <BarraEscala
              etiqueta={`Indicador IBEXIA · ${situacionActual}`}
              valor={analisis.smiActual}
              valorTexto={`${analisis.smiActual?.toFixed(0) ?? '—'} · Percentil ${percentil}`}
              min={-100}
              max={100}
            />

            <p
              style={{
                margin: '16px 0 0 0',
                fontSize: '11.5px',
                color: 'var(--v3-text-mute)',
                lineHeight: 1.5
              }}
            >
              El color indica signo o posición en el rango. No implica valoración.
            </p>
            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '11.5px',
                color: 'var(--v3-text-mute)',
                lineHeight: 1.5
              }}
            >
              Datos históricos descriptivos. No predictivos. No constituyen recomendación de
              inversión.
            </p>
          </div>
        </section>

        {/* GRÁFICO DIARIO */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Evolución del precio y del indicador IBEXIA</h2>
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
            La <strong>línea azul</strong> es el precio. La <strong>línea morada</strong> es el
            indicador IBEXIA: cuanto más arriba está, más cerca ha cotizado el precio de sus
            máximos recientes; cuanto más abajo, más cerca de sus mínimos.
          </p>
          <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />
        </section>

        {/* GRÁFICO SEMANAL */}
        {analisis.velasSemanales && analisis.velasSemanales.length > 0 && (
          <GraficoSemanal
            velas={analisis.velasSemanales}
            smis={analisis.smisSemanales || []}
          />
        )}

        {/* HISTORIAL DE CAMBIOS — acordeón abierto, parte visible */}
        <details open style={estiloAcordeon}>
          <summary style={estiloSummary}>Historial de cambios de esta empresa</summary>
          <div style={{ padding: '0 20px 20px 20px' }}>
            <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: 0 }}>
              Cada fila muestra una sesión en la que el precio cambió de situación dentro de su
              rango.
            </p>
            <TablaSenales senales={analisis.senales} precioActual={null} />
          </div>
        </details>

        {/* ALERTAS EMAIL */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Avisos por email</h2>
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
            Te avisamos cuando esta empresa cambie de zona en su rango de 60 sesiones. Solo el
            dato, sin interpretación.
          </p>
          <FormularioAlerta empresa={empresa} />
        </section>

        {/* ACTUALIZACIONES DEL REGISTRO ESTADÍSTICO */}
        <section style={{ marginTop: '20px' }}>
          <MovimientosHoyCliente variante="home" />
        </section>

        {/* ENCUESTA */}
        <ConsensoComunidad ticker={empresa.ticker} />

        {/* NOTICIAS Y COMPARADOR — sin repetir el valor del sector */}
        {analisis.noticias && analisis.noticias.length > 0 && (
          <ContextoReciente noticias={analisis.noticias} />
        )}

        <ComparadorSector empresa={empresa} analisis={analisis} />

        <BotonesCompartir empresa={empresa} analisis={analisis} url={canonical} />

        {/* DIVULGACIÓN AL FINAL */}
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
              <strong>Metodología.</strong> El indicador IBEXIA es el Stochastic Momentum Index
              (SMI), un oscilador técnico que mide la distancia del precio al punto medio de su
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
      </main>

      <div className="v3-sidebar">
        <BarraLateral ticker={empresa.ticker} />
      </div>
    </div>
  );
}

/**
 * Barra con escala fija centrada en cero.
 * - Para variaciones: min/max en % (ej: -15 / +15).
 * - Para IBEXIA: min/max en -100 / +100.
 * El relleno parte del centro (cero) y se extiende hacia derecha (positivo)
 * o izquierda (negativo). Azul para positivo, gris para negativo.
 */
function BarraEscala({ etiqueta, valor, valorTexto, min, max }) {
  const v = valor === null || valor === undefined || Number.isNaN(valor) ? 0 : valor;
  const clamped = Math.max(min, Math.min(max, v));
  const cero = ((0 - min) / (max - min)) * 100;
  const pos = ((clamped - min) / (max - min)) * 100;
  const ancho = Math.abs(pos - cero);
  const izquierda = pos < cero ? pos : cero;
  const color = clamped >= 0 ? '#2563eb' : '#9ca3af';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '6px',
          fontSize: '12px',
          color: 'var(--v3-text-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          fontWeight: 600
        }}
      >
        <span>{etiqueta}</span>
        <span
          style={{
            color: 'var(--v3-text)',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'none',
            letterSpacing: 0
          }}
        >
          {valorTexto}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: '8px',
          background: 'var(--v3-border)',
          borderRadius: '999px',
          overflow: 'hidden'
        }}
      >
        {/* Marca del cero */}
        <div
          style={{
            position: 'absolute',
            left: `${cero}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'rgba(0,0,0,0.25)'
          }}
        />
        {/* Relleno desde el cero */}
        <div
          style={{
            position: 'absolute',
            left: `${izquierda}%`,
            top: 0,
            bottom: 0,
            width: `${ancho}%`,
            background: color,
            borderRadius: '999px'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--v3-text-mute)',
          marginTop: '2px'
        }}
      >
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
