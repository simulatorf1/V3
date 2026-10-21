import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import { notFound } from 'next/navigation';
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
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import FormularioAlerta from '../../../components/FormularioAlerta';

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

function explicacionPercentil(percentil) {
  if (percentil >= 80) {
    return `Percentil ${percentil}: el precio está en la zona alta de su rango de las últimas 60 sesiones.`;
  }
  if (percentil >= 60) {
    return `Percentil ${percentil}: el precio está en la zona media-alta de su rango de las últimas 60 sesiones.`;
  }
  if (percentil >= 40) {
    return `Percentil ${percentil}: el precio está aproximadamente en la zona central de su rango de las últimas 60 sesiones.`;
  }
  if (percentil >= 20) {
    return `Percentil ${percentil}: el precio está en la zona media-baja de su rango de las últimas 60 sesiones.`;
  }
  return `Percentil ${percentil}: el precio está en la zona baja de su rango de las últimas 60 sesiones.`;
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
    const titulo = `Ficha estadística de ${empresa.nombre} (${empresa.ticker}) — Actualizado ${fecha}`;
    const descripcion = `Ficha informativa y estadística de ${empresa.nombre} (${empresa.ticker}): precio, evolución reciente, comparación sectorial e indicador descriptivo. No es recomendación de inversión.`;
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
    headline: `Ficha estadística de ${empresa.nombre} (${empresa.ticker})`,
    description: `Ficha informativa y estadística de ${empresa.nombre}`,
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

  const variacionSector60 =
    analisis.sectorInfo && analisis.sectorInfo.variacionSector60 !== null
      ? analisis.sectorInfo.variacionSector60
      : null;

  const variacionTexto =
    variacion60 > 0.05
      ? `ha subido un ${variacion60.toFixed(1)}%`
      : variacion60 < -0.05
      ? `ha bajado un ${Math.abs(variacion60).toFixed(1)}%`
      : `se ha mantenido prácticamente estable`;

  let comparacionTexto = '';
  if (variacionSector60 !== null) {
    const diff = variacion60 - variacionSector60;
    if (Math.abs(diff) < 2) comparacionTexto = 'Su evolución es similar a la de su sector.';
    else if (diff > 0) comparacionTexto = 'Su evolución es algo mejor que la de su sector.';
    else comparacionTexto = 'Su evolución es algo peor que la de su sector.';
  }

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

        <section
          className="v3-card"
          style={{
            marginTop: '16px',
            padding: '20px',
            background: 'var(--v3-bg-soft)',
            fontSize: '15px',
            lineHeight: 1.7
          }}
          aria-label="Resumen de la situación actual"
        >
          <p style={{ margin: 0 }}>
            Durante los últimos 60 días, <strong>{empresa.nombre}</strong> {variacionTexto}.
            Actualmente el precio se encuentra en una <strong>{situacionActual}</strong> respecto a
            su propio comportamiento reciente.
            {comparacionTexto && ` ${comparacionTexto}`}
          </p>
        </section>

        <section className="v3-seccion" style={{ marginTop: '24px' }}>
          <h2 className="v3-seccion-titulo">Datos clave</h2>
          <div className="v3-card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px'
              }}
            >
              <Dato etiqueta="Precio actual" valor={`${precioActual?.toFixed(2) ?? '—'} €`} />
              <Dato
                etiqueta="Variación en 5 sesiones"
                valor={`${variacion5 >= 0 ? '+' : ''}${variacion5.toFixed(2)}%`}
              />
              <Dato
                etiqueta="Variación en 60 sesiones"
                valor={`${variacion60 >= 0 ? '+' : ''}${variacion60.toFixed(2)}%`}
              />
              <Dato
                etiqueta="Sector (60 sesiones)"
                valor={
                  variacionSector60 !== null
                    ? `${variacionSector60 >= 0 ? '+' : ''}${variacionSector60.toFixed(2)}%`
                    : '—'
                }
              />
            </div>
          </div>
        </section>

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Situación actual</h2>
          <div className="v3-card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '20px', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
              {situacionActual.charAt(0).toUpperCase() + situacionActual.slice(1)}
            </p>
            <p
              style={{
                margin: '12px 0 0 0',
                fontSize: '13px',
                color: 'var(--v3-text-soft)',
                lineHeight: 1.6
              }}
            >
              {explicacionPercentil(percentil)}
            </p>
            {ultimaSenal && (
              <p
                style={{
                  margin: '10px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--v3-text-mute)'
                }}
              >
                Último cambio de situación: {ultimaSenal.fecha} (
                {situacionDesdeTipo(ultimaSenal.tipo)}).
              </p>
            )}
          </div>
        </section>

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">¿Para qué sirve este indicador?</h2>
          <div
            className="v3-card"
            style={{
              padding: '20px',
              background: 'var(--v3-bg-soft)',
              lineHeight: 1.7,
              fontSize: '14.5px'
            }}
          >
            <p style={{ marginTop: 0 }}>
              Este indicador sirve para contextualizar dónde se encuentra el precio actual
              respecto a su comportamiento reciente.
            </p>
            <p>No intenta predecir el futuro.</p>
            <p style={{ marginBottom: 0 }}>
              Simplemente muestra si el precio actual está situado en una zona alta, intermedia o
              baja de su rango de las últimas 60 sesiones.
            </p>
          </div>
        </section>

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Evolución del precio y del indicador</h2>
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
            La <strong>línea azul</strong> es el precio. La <strong>línea morada</strong> es el
            indicador: cuanto más arriba está, más cerca ha cotizado el precio de sus máximos
            recientes; cuanto más abajo, más cerca de sus mínimos.
          </p>
          <div
            className="v3-card"
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: 'var(--v3-bg-soft)',
              borderLeft: '3px solid #9ca3af',
              fontSize: '12.5px',
              color: 'var(--v3-text-soft)',
              lineHeight: 1.6
            }}
          >
            Este gráfico representa exclusivamente información histórica ya ocurrida. No
            identifica oportunidades de inversión, no anticipa movimientos futuros, no estima
            probabilidades futuras y no debe utilizarse para adoptar decisiones de compra, venta o
            mantenimiento de instrumentos financieros.
          </div>
          <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />

          {analisis.velasSemanales && analisis.velasSemanales.length > 0 && (
            <GraficoSemanal velas={analisis.velasSemanales} />
          )}
        </section>

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Historial de cambios de rango</h2>
          <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
            Cada fila muestra una sesión en la que el precio cambió de situación dentro de su
            rango. Sirve para ver con qué frecuencia ha estado en cada zona durante el último año.
          </p>
          <TablaSenales senales={analisis.senales} precioActual={null} />
        </section>

        {analisis.noticias && analisis.noticias.length > 0 && (
          <ContextoReciente noticias={analisis.noticias} />
        )}

        <ComparadorSector empresa={empresa} analisis={analisis} />

        <FormularioAlerta empresa={empresa} />

        <ConsensoComunidad ticker={empresa.ticker} />

        <BotonesCompartir empresa={empresa} analisis={analisis} url={canonical} />

        <section
          className="v3-card"
          style={{
            marginTop: '40px',
            padding: '20px',
            borderLeft: '4px solid #9ca3af',
            background: 'var(--v3-bg-soft)'
          }}
          aria-label="Divulgación regulatoria"
        >
          <h2 style={{ marginTop: 0, fontSize: '15px' }}>Divulgación regulatoria</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: 1.7 }}>
            El contenido de esta página tiene <strong>finalidad exclusivamente estadística e
            informativa</strong>. No constituye asesoramiento financiero, recomendación de
            inversión, análisis financiero regulado, oferta ni solicitud de compra o venta de
            instrumentos financieros. Los datos mostrados se basan en información histórica de
            mercado y se presentan con carácter descriptivo. No existe capacidad predictiva
            demostrada: la evolución pasada no garantiza resultados futuros y no permite deducir
            probabilidades ni resultados futuros. El usuario debe tomar sus propias decisiones de
            inversión de forma independiente y, en su caso, consultar a un asesor financiero
            debidamente autorizado.
          </p>
        </section>

        <section className="v3-seccion" aria-label="Conflictos de interés">
          <h2 className="v3-seccion-titulo">Conflictos de interés</h2>
          <div className="v3-card" style={{ padding: '20px', lineHeight: 1.7, fontSize: '13px' }}>
            <p style={{ marginTop: 0 }}>
              Equaty es una plataforma de contenido estadístico e informativo. Su política respecto
              a los valores analizados es la siguiente:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>
                <strong>Posiciones:</strong> Equaty no mantiene posiciones propias en los
                instrumentos financieros sobre los que publica fichas estadísticas, ni opera en
                los mercados con la finalidad de beneficiarse de la evolución de dichos
                instrumentos.
              </li>
              <li>
                <strong>Relaciones comerciales:</strong> Equaty no mantiene acuerdos comerciales
                con los emisores de los instrumentos analizados que pudieran influir en el
                contenido de las fichas. En caso de que existiera cualquier relación de este tipo,
                se haría constar de forma expresa y visible en esta sección.
              </li>
              <li>
                <strong>Fuentes de ingresos:</strong> la plataforma puede generar ingresos por
                publicidad, suscripciones o servicios de datos agregados. Estas fuentes de ingreso
                no condicionan la elaboración del contenido estadístico, que se rige por criterios
                descriptivos y neutrales.
              </li>
            </ul>
            <p style={{ marginBottom: 0 }}>
              El contenido de esta ficha se elabora de forma independiente a las circunstancias
              personales de cada lector y no constituye asesoramiento financiero personalizado.
            </p>
          </div>
        </section>
      </main>

      <div className="v3-sidebar">
        <BarraLateral ticker={empresa.ticker} />
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <div
        style={{
          color: 'var(--v3-text-mute)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          marginBottom: '6px'
        }}
      >
        {etiqueta}
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--v3-text)',
          lineHeight: 1.2,
          wordBreak: 'break-word'
        }}
      >
        {valor}
      </div>
    </div>
  );
}
