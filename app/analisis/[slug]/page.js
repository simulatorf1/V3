import { obtenerOCrearEmpresa, obtenerAnalisis } from '../../../lib/autogenerar';
import { notFound } from 'next/navigation';
import Grafico from '../../../components/Grafico';
import ResumenVistazo from '../../../components/ResumenVistazo';
import QueEstaPasando from '../../../components/QueEstaPasando';
import ContextoReciente from '../../../components/ContextoReciente';
import ComparadorSector from '../../../components/ComparadorSector';
import TablaSenales from '../../../components/TablaSenales';
import BloqueSEO from '../../../components/BloqueSEO';

export const dynamic = 'force-dynamic';

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

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
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
        {analisis && (
          <li><strong>Precio actual:</strong> {analisis.precioActual?.toFixed(2)}</li>
        )}
        {analisis && (
          <li><strong>Indicador propietario:</strong> {analisis.smiActual?.toFixed(2)} (zona {analisis.zona})</li>
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

          <h2 style={{ marginTop: '30px' }}>Estadística histórica (10 días siguientes)</h2>
          <p style={{ color: '#666', fontSize: '13px' }}>
            Basado en {analisis.estadisticas.compras.muestra} señales de compra y {analisis.estadisticas.ventas.muestra} señales de venta en el último año.
          </p>

          {analisis.estadisticas.compras.muestra < 10 && (
            <p style={{ color: '#c62828', fontSize: '13px', marginTop: '6px' }}>
              Muestra limitada. Interpretar con cautela.
            </p>
          )}

          <h3 style={{ marginTop: '20px' }}>Después de señales de compra</h3>
          <ul>
            <li>Veces que subió: {analisis.estadisticas.compras.porcentajeSubidas?.toFixed(1) || 0}%</li>
            <li>Veces que bajó: {analisis.estadisticas.compras.porcentajeBajadas?.toFixed(1) || 0}%</li>
            <li>Variación media: {analisis.estadisticas.compras.variacionMedia?.toFixed(2) || 0}%</li>
          </ul>

          <h3 style={{ marginTop: '20px' }}>Después de señales de venta</h3>
          <ul>
            <li>Veces que subió: {analisis.estadisticas.ventas.porcentajeSubidas?.toFixed(1) || 0}%</li>
            <li>Veces que bajó: {analisis.estadisticas.ventas.porcentajeBajadas?.toFixed(1) || 0}%</li>
            <li>Variación media: {analisis.estadisticas.ventas.variacionMedia?.toFixed(2) || 0}%</li>
          </ul>

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
  );
}
