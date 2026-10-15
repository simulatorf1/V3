import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Grafico from '../../../components/Grafico';
import ExplicacionGrafico from '../../../components/ExplicacionGrafico';
import ResumenVistazo from '../../../components/ResumenVistazo';
import QueEstaPasando from '../../../components/QueEstaPasando';
import ContextoReciente from '../../../components/ContextoReciente';
import ComparadorSector from '../../../components/ComparadorSector';
import TablaSenales from '../../../components/TablaSenales';
import BloqueSEO from '../../../components/BloqueSEO';
import ConsensoComunidad from '../../../components/ConsensoComunidad';
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
    const variacion = precioCierre
      ? ((precioCierre - s.precio) / s.precio) * 100
      : 0;

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

  const empresa = await obtenerOCrearEmpresa(ticker);
  if (!empresa) {
    return { title: 'Empresa no encontrada — Equaty' };
  }

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
}

export default async function PaginaEmpresa({ params }) {
  const slug = params.slug;

  let ticker;
  if (slug.includes('__')) {
    ticker = slug.split('__')[0].toUpperCase();
  } else {
    ticker = slug.split('-')[0].toUpperCase();
  }

  const empresa = await obtenerOCrearEmpresa(ticker);
  if (!empresa) {
    notFound();
  }

  let analisis = null;
  let desdeCache = false;
  let errorAnalisis = null;
  try {
    const resultado = await obtenerAnalisis(ticker, empresa);
    analisis = resultado.analisis;
    desdeCache = resultado.desdeCache;
  } catch (e) {
    errorAnalisis = e.message;
    console.error('Error generando análisis:', e.message);
  }

  const canonical = `${BASE_URL}/analisis/${slug}`;

  const schema = analisis
    ? {
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
      }
    : null;

  if (!analisis) {
    return (
      <div
        className="v3-container"
        style={{ maxWidth: '700px', textAlign: 'center', paddingTop: '60px' }}
      >
        <h1>
          {empresa.nombre} ({empresa.ticker})
        </h1>
        <p style={{ color: 'var(--v3-text-soft)', marginTop: '20px' }}>
          Estamos preparando el análisis de esta empresa. Suele tardar unos segundos.
        </p>
        <p style={{ marginTop: '30px' }}>
          <Link href={`/analisis/${slug}`} className="v3-btn">
            Recargar página
          </Link>
        </p>
        <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '40px' }}>
          Si tras varios intentos sigue sin cargar, es posible que no haya datos suficientes para
          esta empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="v3-grid-analisis">
      <main>
        <link rel="canonical" href={canonical} />
        {schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        )}

        <RegistrarVisita ticker={empresa.ticker} ruta={`/analisis/${slug}`} />

        <nav
          aria-label="Migas de pan"
          style={{
            color: 'var(--v3-text-soft)',
            fontSize: '13px',
            marginBottom: '16px'
          }}
        >
          <Link href="/" style={{ color: 'var(--v3-text-soft)' }}>
            Inicio
          </Link>
          {' > '}
          <Link
            href={
              empresa.sector ? `/sectores/${slugSector(empresa.sector)}` : '/sectores'
            }
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

        {errorAnalisis && (
          <p style={{ color: 'var(--v3-negative)', marginTop: '20px' }}>
            No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o
            ticker.
          </p>
        )}

        <ResumenVistazo analisis={analisis} empresa={empresa} />

        <EstadisticaHistorica
          senales={analisis.senales}
          precioActual={analisis.precioActual}
        />

        <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />

        <ExplicacionGrafico analisis={analisis} />

        <QueEstaPasando analisis={analisis} />

        <ContextoReciente noticias={analisis.noticias} />

        <ComparadorSector empresa={empresa} analisis={analisis} />

        <TablaSenales senales={analisis.senales} precioActual={analisis.precioActual} />

        <BloqueSEO empresa={empresa} analisis={analisis} />

        <ConsensoComunidad ticker={empresa.ticker} />

        <BotonesCompartir empresa={empresa} analisis={analisis} url={canonical} />

        <p className="v3-aviso-mute">
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

function EstadisticaHistorica({ senales, precioActual }) {
  if (!senales || senales.length === 0) return null;

  const ciclos = calcularCiclos(senales, precioActual, MAX_SENALES_TABLA);
  const compras = ciclos.filter((c) => c.tipo === 'compra');
  const ventas = ciclos.filter((c) => c.tipo === 'venta');

  function analizar(lista) {
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

  const statsCompras = analizar(compras);
  const statsVentas = analizar(ventas);

  const listaOrdenada = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const ultima =
    listaOrdenada.length > 0 ? listaOrdenada[listaOrdenada.length - 1] : null;
  const ultimaSenalTipo = ultima ? ultima.tipo : null;
  const porcentajeUltimaSenal =
    ultimaSenalTipo === 'compra'
      ? statsCompras.porcentajeAcierto
      : ultimaSenalTipo === 'venta'
      ? statsVentas.porcentajeAcierto
      : null;

  return (
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

      {ultimaSenalTipo && typeof porcentajeUltimaSenal === 'number' && (
        <div
          className="v3-card-soft"
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ color: 'var(--v3-text-soft)' }}>
            <strong>Último movimiento registrado:</strong>
          </span>
          <span className="v3-tag">{ultimaSenalTipo}</span>
          <span>
            acierto histórico de este tipo de movimiento:{' '}
            <strong>{porcentajeUltimaSenal.toFixed(1)}%</strong>
          </span>
        </div>
      )}
    </section>
  );
}
