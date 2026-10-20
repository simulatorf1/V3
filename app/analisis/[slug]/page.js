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
import FormularioAlerta from '../../../components/FormularioAlerta';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BASE_URL = 'https://equaty.es';

function etiquetaLectura(tipo) {
  if (tipo === 'compra') return 'Categoría C';
  if (tipo === 'venta') return 'Categoría A';
  return '—';
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
    const titulo = `Registro estadístico de ${empresa.nombre} (${empresa.ticker}) — Actualizado ${fecha}`;
    const descripcion = `Ficha informativa y estadística de ${empresa.nombre} (${empresa.ticker}): indicador descriptivo, categorías estadísticas e histórico de registros. No es recomendación de inversión.`;
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
    headline: `Registro estadístico de ${empresa.nombre} (${empresa.ticker})`,
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

  // Colores neutrales azul/gris (sin rojo/verde)
  const colorCategoria =
    analisis.zona === 'alta'
      ? '#2563eb'
      : analisis.zona === 'baja'
      ? '#9ca3af'
      : 'var(--v3-text-soft)';

  const etiquetaZona =
    analisis.zona === 'alta'
      ? 'Categoría A'
      : analisis.zona === 'baja'
      ? 'Categoría C'
      : 'Categoría B';

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
          Registro estadístico de {empresa.nombre} ({empresa.ticker})
        </h1>

        <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px' }}>
          Última actualización: {fechaMadrid()}
          {desdeCache && ' · desde caché'}
        </p>

        {/* BLOQUE ÚNICO DE DIVULGACIÓN REGULATORIA */}
        <section
          className="v3-card"
          style={{
            marginTop: '20px',
            padding: '20px',
            borderLeft: '4px solid #9ca3af',
            background: 'var(--v3-bg-soft)'
          }}
          aria-label="Divulgación regulatoria"
        >
          <h2 style={{ marginTop: 0, fontSize: '16px' }}>Divulgación regulatoria</h2>
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
                colorExtra="var(--v3-text-soft)"
              />
            </div>
          </div>
        </section>

        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Sobre {empresa.nombre}</h2>
          <p style={{ lineHeight: 1.7 }}>
            {empresa.nombre} ({empresa.ticker}) cotiza en{' '}
            {empresa.mercado || 'mercado no especificado'} y pertenece al sector{' '}
            {empresa.sector || 'sector no especificado'}. La información utilizada en esta ficha
            procede de series históricas públicas de mercado y se revisa periódicamente por el
            equipo de Equaty con criterios descriptivos.
          </p>
          <ComparadorSector empresa={empresa} analisis={analisis} />
        </section>

        {/* BLOQUE 3: Estado actual del indicador */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Estado actual del indicador (descriptivo)</h2>
          <div className="v3-card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: colorCategoria
                }}
              >
                {etiquetaZona}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--v3-text-soft)' }}>
                Percentil {percentil} sobre 60 sesiones
              </div>
            </div>
            <p
              style={{
                margin: '12px 0 0 0',
                fontSize: '13px',
                color: 'var(--v3-text-soft)',
                lineHeight: 1.6
              }}
            >
              Valor de lectura actual: <strong>{analisis.smiActual?.toFixed(2) ?? '—'}</strong>.
              Este dato describe de forma descriptiva dónde se sitúa el precio dentro de su rango
              reciente. No es una señal de acción ni una recomendación de compra o de venta.
            </p>
            {ultimaSenal && (
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '12px',
                  color: 'var(--v3-text-mute)'
                }}
              >
                Último registro estadístico: {ultimaSenal.fecha} (tipo de registro:{' '}
                {etiquetaLectura(ultimaSenal.tipo)}).
              </p>
            )}
          </div>
        </section>

        {/* AVISO ANTES DEL GRÁFICO PRINCIPAL */}
        <div
          className="v3-card"
          style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: 'var(--v3-bg-soft)',
            borderLeft: '4px solid #9ca3af',
            fontSize: '13px',
            lineHeight: 1.7,
            color: 'var(--v3-text-soft)'
          }}
        >
          Este gráfico representa exclusivamente información histórica ya ocurrida. No identifica
          oportunidades de inversión, no anticipa movimientos futuros, no estima probabilidades
          futuras y no debe utilizarse para adoptar decisiones de compra, venta o mantenimiento de
          instrumentos financieros.
        </div>

        <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />

        {/* Interpretación del gráfico */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Interpretación descriptiva del gráfico</h2>
          <div className="v3-card" style={{ lineHeight: 1.75 }}>
            <p style={{ marginTop: 0, fontSize: '14px', color: 'var(--v3-text)' }}>
              En las últimas 60 sesiones, <strong>{empresa.nombre}</strong> ha pasado de{' '}
              <strong>{primerCierre?.toFixed(2)}</strong> a{' '}
              <strong>{ultimoCierre?.toFixed(2)}</strong>, con una variación del{' '}
              <strong>{variacion60 >= 0 ? '+' : ''}{variacion60.toFixed(2)}%</strong>. El rango de
              cotización se ha movido entre un mínimo de <strong>{minimo.toFixed(2)}</strong> y un
              máximo de <strong>{maximo.toFixed(2)}</strong>, y la volatilidad diaria media ha
              sido del <strong>{volatilidad.toFixed(2)}%</strong>.
            </p>

            <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
              De las <strong>{totalSesiones}</strong> sesiones analizadas, el indicador se ha
              clasificado en <strong>{enAlta}</strong> sesiones en Categoría A,{' '}
              <strong>{enMedia}</strong> en Categoría B y <strong>{enBaja}</strong> en Categoría
              C. Estas cifras son puramente descriptivas y reflejan la posición del precio dentro
              de su propio rango reciente en cada sesión.
            </p>

            <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
              En el último registro, el indicador se sitúa en un valor de{' '}
              <strong>{analisis.smiActual?.toFixed(2)}</strong>, dentro de la{' '}
              <strong style={{ color: colorCategoria }}>{etiquetaZona}</strong>, con un percentil{' '}
              <strong>{percentil}</strong> sobre las últimas 60 sesiones.
            </p>

            {ultimaSenal && (
              <p style={{ fontSize: '14px', color: 'var(--v3-text)' }}>
                La última actualización del registro estadístico fue el{' '}
                <strong>{ultimaSenal.fecha}</strong>.
              </p>
            )}

            {consenso && consenso.total > 0 && (
              <p style={{ fontSize: '14px', color: 'var(--v3-text)', marginBottom: 0 }}>
                La encuesta de visitantes muestra <strong>{consenso.total}</strong>{' '}
                {consenso.total === 1 ? 'respuesta' : 'respuestas'} registradas. Los resultados
                reflejan únicamente respuestas voluntarias de visitantes y no tienen valor
                analítico, predictivo ni financiero.
              </p>
            )}
          </div>
        </section>

        <FormularioAlerta empresa={empresa} />

        {/* BLOQUE 2: Indicador propio */}
        <section className="v3-seccion">
          <h2 className="v3-seccion-titulo">Indicador estadístico descriptivo</h2>
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
              <Dato etiqueta="Categoría" valor={etiquetaZona} colorValor={colorCategoria} />
              <Dato etiqueta="Percentil" valor={percentil} extra="Posición en 60 sesiones" />
            </div>

            <p
              style={{
                margin: '20px 0 0 0',
                fontSize: '14px',
                color: 'var(--v3-text)',
                lineHeight: 1.7
              }}
            >
              El <strong>indicador estadístico descriptivo de Equaty</strong> es un algoritmo
              interno que combina varias referencias técnicas clásicas (medias móviles, RSI,
              estocástico y bandas de Bollinger, entre otras) para describir en qué punto del
              rango reciente se encuentra el precio. El resultado se normaliza en una escala de{' '}
              <strong>-100 a +100</strong>. El indicador se clasifica en tres categorías
              estadísticas (A, B y C) con finalidad exclusivamente descriptiva y sin implicación
              positiva o negativa. El <strong>percentil</strong> señala la posición exacta del
              valor de hoy dentro de las últimas 60 sesiones: 0 es el mínimo y 100 el máximo. Es
              un dato exclusivamente descriptivo de hechos pasados: no predice el futuro, no
              permite deducir probabilidades ni resultados futuros y no constituye una señal de
              actuación.
            </p>
          </div>
        </section>

        <ConsensoComunidad ticker={empresa.ticker} />

        <TablaSenales senales={analisis.senales} precioActual={null} />

        {analisis.noticias && analisis.noticias.length > 0 && (
          <ContextoReciente noticias={analisis.noticias} />
        )}

        <BotonesCompartir
          empresa={empresa}
          analisis={analisis}
          url={canonical}
          futuro={null}
        />

        {/* SECCIÓN DE CONFLICTOS DE INTERÉS */}
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
