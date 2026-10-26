import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import WatchlistZona from '../../components/WatchlistZona';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mis favoritos — Equaty',
  description: 'Centro de seguimiento de tus empresas favoritas.'
};

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

export default async function PaginaFavoritos() {
  const { data: paginas } = await supabase
    .from('paginas')
    .select('ticker, datos')
    .order('actualizado_at', { ascending: false })
    .limit(500);

  const { data: empresas } = await supabase.from('empresas').select('ticker, nombre, sector');

  const empresasMap = {};
  for (const e of empresas || []) {
    if (e && e.ticker) empresasMap[e.ticker] = e;
  }

  const items = [];
  for (const p of paginas || []) {
    const datos = parseDatos(p.datos);
    if (!datos) continue;
    const emp = empresasMap[p.ticker];
    const velas = datos.velasUltimas60 || [];
    const smis = datos.smisUltimos60 || [];
    const indicador = datos.smiActual;

    let percentil = null;
    const validos = smis.filter((v) => v !== null && v !== undefined);
    if (validos.length > 0 && indicador !== null && indicador !== undefined) {
      const menores = validos.filter((v) => v < indicador).length;
      percentil = Math.round((menores / validos.length) * 100);
    }

    let variacion60 = null;
    if (velas.length >= 2) {
      const primero = velas[0]?.close;
      const ultimo = velas[velas.length - 1]?.close;
      if (primero) variacion60 = ((ultimo - primero) / primero) * 100;
    }

    items.push({
      ticker: p.ticker,
      nombre: emp?.nombre || p.ticker,
      sector: emp?.sector || null,
      precio: datos.precioActual,
      zona: datos.zona,
      percentil,
      variacion60,
      indicador
    });
  }

  return (
    <WatchlistZona>
      <main className="v3-container">
        <h1>Mis favoritos</h1>
        <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px' }}>
          Centro de seguimiento de las empresas que has marcado como favoritas. Los cálculos se
          hacen en tu navegador comparando el estado actual con el de tu última visita.
        </p>
        <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px' }}>
          {items.length} empresas con datos disponibles.
        </p>

        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: 'var(--v3-bg-soft)',
            borderRadius: 'var(--v3-radius-sm)',
            fontSize: '13px',
            color: 'var(--v3-text-soft)'
          }}
        >
          El centro de seguimiento personal se calcula en el navegador a partir de tu lista de
          favoritos y del estado guardado en tu última visita. Para verlo, añade empresas desde sus
          fichas y vuelve a esta página en tu próxima visita.
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              color: '#fff',
              borderRadius: 'var(--v3-radius-sm)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </WatchlistZona>
  );
}
