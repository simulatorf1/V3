import { supabase } from '../../../lib/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PaginaEmpresa({ params }) {
  const slug = params.slug;

  // El slug tiene formato "ticker-nombre". Extraemos el ticker (antes del primer guion).
  const ticker = slug.split('-')[0].toUpperCase();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('ticker, nombre, sector, mercado')
    .eq('ticker', ticker)
    .maybeSingle();

  if (error || !empresa) {
    notFound();
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
      </ul>

      <p style={{ color: '#666', fontSize: '14px', marginTop: '30px' }}>
        Próximamente: gráfico, indicador, señales históricas, noticias, comparativa sectorial y estadísticas.
      </p>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        Este análisis se elabora de forma independiente a las circunstancias personales de cada lector.
        No constituye asesoramiento financiero personalizado.
      </p>
    </main>
  );
}
