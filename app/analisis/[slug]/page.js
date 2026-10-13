import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import { notFound } from 'next/navigation';
import Grafico from '../../../components/Grafico';
import ResumenVistazo from '../../../components/ResumenVistazo';
import QueEstaPasando from '../../../components/QueEstaPasando';
import ContextoReciente from '../../../components/ContextoReciente';
import ComparadorSector from '../../../components/ComparadorSector';
import TablaSenales from '../../../components/TablaSenales';
import BloqueSEO from '../../../components/BloqueSEO';
import ConsensoComunidad from '../../../components/ConsensoComunidad';
import RegistrarVisita from '../../../components/RegistrarVisita';
import BarraLateral from '../../../components/BarraLateral';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://v3-rho-weld.vercel.app';

export async function generateMetadata({ params }) {
  const slug = params.slug;
  let ticker;
  if (slug.includes('__')) ticker = slug.split('__')[0].toUpperCase();
  else ticker = slug.split('-')[0].toUpperCase();

  const empresa = await obtenerOCrearEmpresa(ticker);
  if (!empresa) {
    return { title: 'Empresa no encontrada — V3' };
  }

  const titulo = `Análisis técnico y estadístico de ${empresa.nombre} (${empresa.ticker}) — Actualizado ${new Date().toLocaleDateString('es-ES')}`;
  const descripcion = `Análisis estadístico automatizado de ${empresa.nombre} (${empresa.ticker}): indicador propietario, zonas, señales históricas y estadística. No es recomendación de inversión.`;
  const canonical = `${BASE_URL}/analisis/${slug}`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: canonical,
      siteName: 'V3',
      type: 'article',
      locale: 'es_ES'
    },
    twitter: {
      card: 'summary',
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
  }

  const canonical = `${BASE_URL}/analisis/${slug}`;

  // Schema.org JSON-LD
  const schema = analisis
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Análisis técnico y estadístico de ${empresa.nombre} (${empresa.ticker})`,
        description: `Análisis estadístico automatizado de ${empresa.nombre}`,
        url: canonical,
        datePublished: analisis.generado_at,
        dateModified: analisis.generado_at,
        author: { '@type': 'Organization', name: 'V3' },
        publisher: { '@type': 'Organization', name: 'V3' },
        about: {
          '@type': 'FinancialProduct',
          name: empresa.nombre,
          identifier: empresa.ticker
        }
      }
    : null;

  return (
    <div
      className="v3-grid-analisis"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <main>
        <link rel="canonical" href={canonical} />
        {schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        )}

        <RegistrarVisita ticker={empresa.ticker} ruta={`/analisis/${slug}`} />

        <p style={{ color: '#666', fontSize: '13px' }}>
          Inicio &gt; {empresa.sector || 'Sector'} &gt; {empresa.nombre}
        </p>

        <h1>
          Análisis técnico y estadístico de {empresa.nombre} ({empresa.ticker})
        </h1>

        <p style={{ color: '#666', fontSize: '13px' }}>
          Última actualización: {new Date().toLocaleString('es-ES')}
          {desdeCache && ' · desde caché'}
        </p>

        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #ffe082',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '20px',
            fontSize: '14px'
          }}
        >
          Este contenido es un análisis estadístico generado automáticamente por un algoritmo.
          No es una recomendación de inversión.
        </div>

        <h2 style={{ marginTop: '30px' }}>Datos rápidos</h2>
        <ul>
          <li><strong>Ticker:</strong> {empresa.ticker}</li>
          <li><strong>Sector:</strong> {empresa.sector || 'N/A'}</li>
          <li><strong>Mercado:</strong> {empresa.mercado || 'N/A'}</li>
          {analisis && <li><strong>Precio actual:</strong> {analisis.precioActual?.toFixed(2)}</li>}
          {analisis && (
            <li>
              <strong>Indicador propietario:</strong> {analisis.smiActual?.toFixed(2)} (zona {analisis.zona})
            </li>
          )}
        </ul>

        {errorAnalisis && (
          <p style={{ color: '#c62828', marginTop: '20px' }}>
            No se han encontrado datos suficientes para esta empresa. Prueba con otro nombre o ticker.
          </p>
        )}

        {analisis && (
          <>
            <ResumenVistazo analisis={analisis} empresa={empresa} />
            <Grafico velas={analisis.velasUltimas60} smis={analisis.smisUltimos60} />
            <QueEstaPasando analisis={analisis} />
            <ContextoReciente noticias={analisis.noticias} />
            <ComparadorSector empresa={empresa} analisis={analisis} />
            <TablaSenales senales={analisis.senales} precioActual={analisis.precioActual} />
            <BloqueSEO empresa={empresa} analisis={analisis} />
            <ConsensoComunidad ticker={empresa.ticker} />
            <EstadisticaHistorica analisis={analisis} />
            <p style={{ color: '#666', fontSize: '13px', marginTop: '20px' }}>
              Esta estadística se basa exclusivamente en datos históricos y no garantiza ningún resultado futuro.
              El usuario debe tomar sus propias decisiones de inversión.
            </p>
          </>
        )}

        <p style={{ color: '#666', fontSize: '13px', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          Este análisis se elabora de forma independiente a las circunstancias personales de cada lector.
          No constituye asesoramiento financiero personalizado.
        </p>
      </main>

      <div className="v3-sidebar">
        <BarraLateral ticker={empresa.ticker} />
      </div>
    </div>
  );
}

function EstadisticaHistorica({ analisis }) {
  const stats = analisis.estadisticas;
  if (!stats || !stats.compras || !stats.ventas) return null;

  const { compras, ventas, ultimaSenalTipo, porcentajeUltimaSenal } = stats;
  const colorCompra = compras.muestra > 0 ? '#2e7d32' : '#666';
  const colorVenta = ventas.muestra > 0 ? '#2e7d32' : '#666';

  return (
    <div style={{ marginTop: '40px' }}>
      <h2>Estadística histórica</h2>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Calculada sobre los ciclos cerrados del registro histórico de señales (compra → siguiente señal, venta → siguiente señal).
      </p>

      <h3 style={{ marginTop: '20px' }}>Señales de compra</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><strong>Total de compras registradas:</strong> {compras.muestra ?? 0}</li>
        <li><strong>Aciertos</strong> (precio subió hasta la siguiente señal): {compras.aciertos ?? 0}</li>
        <li><strong>Fallos</strong> (precio bajó hasta la siguiente señal): {compras.fallos ?? 0}</li>
        <li style={{ marginTop: '6px' }}>
          <strong style={{ color: colorCompra }}>Porcentaje de acierto:</strong>{' '}
          {compras.muestra > 0 && typeof compras.porcentajeAcierto === 'number'
            ? `${compras.porcentajeAcierto.toFixed(1)}%`
            : '—'}
        </li>
      </ul>

      <h3 style={{ marginTop: '20px' }}>Señales de venta</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><strong>Total de ventas registradas:</strong> {ventas.muestra ?? 0}</li>
        <li><strong>Aciertos</strong> (precio bajó hasta la siguiente señal): {ventas.aciertos ?? 0}</li>
        <li><strong>Fallos</strong> (precio subió hasta la siguiente señal): {ventas.fallos ?? 0}</li>
        <li style={{ marginTop: '6px' }}>
          <strong style={{ color: colorVenta }}>Porcentaje de acierto:</strong>{' '}
          {ventas.muestra > 0 && typeof ventas.porcentajeAcierto === 'number'
            ? `${ventas.porcentajeAcierto.toFixed(1)}%`
            : '—'}
        </li>
      </ul>

      {ultimaSenalTipo && typeof porcentajeUltimaSenal === 'number' && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Última señal registrada:</strong> {ultimaSenalTipo} — porcentaje de acierto histórico de este tipo de señal:{' '}
            <strong>{porcentajeUltimaSenal.toFixed(1)}%</strong>
          </p>
        </div>
      )}
    </div>
  );
}
