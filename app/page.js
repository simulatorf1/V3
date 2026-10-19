import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

function calcularAciertos(senales, velas) {
  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const velasOrdenadas = [...velas].sort((a, b) => (a.date < b.date ? -1 : 1));

  const ciclos = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const fechaInicio = s.fecha;
    const fechaFin = siguiente ? siguiente.fecha : null;

    let extremo = null;
    for (const v of velasOrdenadas) {
      if (v.date < fechaInicio) continue;
      if (fechaFin && v.date >= fechaFin) break;
      if (s.tipo === 'compra') {
        if (extremo === null || v.high > extremo) extremo = v.high;
      } else {
        if (extremo === null || v.low < extremo) extremo = v.low;
      }
    }

    let acierto = null;
    if (extremo !== null) {
      if (s.tipo === 'compra') {
        const variacion = ((extremo - s.precio) / s.precio) * 100;
        acierto = variacion > 0;
      } else {
        const variacion = ((s.precio - extremo) / s.precio) * 100;
        acierto = variacion > 0;
      }
    }

    return { tipo: s.tipo, acierto };
  });

  function stats(tipo) {
    const filtrados = ciclos.filter((c) => c.tipo === tipo);
    let aciertos = 0;
    let total = 0;
    for (const c of filtrados) {
      if (c.acierto === null) continue;
      total++;
      if (c.acierto) aciertos++;
    }
    return {
      muestra: filtrados.length,
      aciertos,
      fallos: total - aciertos,
      porcentajeAcierto: total > 0 ? (aciertos / total) * 100 : 0
    };
  }

  return { compras: stats('compra'), ventas: stats('venta') };
}

async function cargarDatos() {
  const vacio = { cambios: [], sectores: [] };

  try {
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [paginasRes, empresasRes] = await Promise.all([
      supabase
        .from('paginas')
        .select('ticker, datos, actualizado_at')
        .gte('actualizado_at', hace48h)
        .order('actualizado_at', { ascending: false })
        .limit(20),
      supabase.from('empresas').select('ticker, nombre, sector')
    ]);

    const paginas = paginasRes?.data || [];
    const empresas = empresasRes?.data || [];

    const empresasMap = {};
    for (const e of empresas) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const cambios = [];
    for (const p of paginas) {
      if (!p || !p.datos) continue;
      const emp = empresasMap[p.ticker];
      if (!emp) continue;

      let datos = p.datos;
      if (typeof datos === 'string') {
        try {
          datos = JSON.parse(datos);
        } catch (e) {
          continue;
        }
      }

      let senales = datos.senales;
      if (typeof senales === 'string') {
        try { senales = JSON.parse(senales); } catch (e) { senales = []; }
      }
      let velas = datos.velasUltimos60;
      if (typeof velas === 'string') {
        try { velas = JSON.parse(velas); } catch (e) { velas = []; }
      }

      const stats = calcularAciertos(senales || [], velas || []);

      cambios.push({
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        precio: datos.precioActual,
        stats
      });
    }

    const conteoSectores = {};
    for (const e of empresas) {
      if (!e || !e.sector) continue;
      conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
    }
    const sectores = Object.entries(conteoSectores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([sector, empresas]) => ({ sector, empresas }));

    return { cambios, sectores };
  } catch (e) {
    console.error('[home] Error cargando datos:', e.message);
    return vacio;
  }
}

export default async function Home() {
  const datos = await cargarDatos();

  return (
    <main className="v3-container">
      <section className="v3-hero">
        <h1>Equaty — Análisis bursátil estadístico</h1>
        <p>
          Informes estadísticos sobre empresas cotizadas. Busca cualquier valor por nombre o
          ticker.
        </p>
      </section>

      <Buscador />

      <div
        style={{
          marginTop: '20px',
          padding: '18px 20px',
          background: 'var(--v3-bg-soft)',
          border: '1px solid var(--v3-border)',
          borderRadius: 'var(--v3-radius-sm)',
          textAlign: 'center'
        }}
      >
        <p style={{ margin: 0, color: 'var(--v3-text-soft)', fontSize: '14px' }}>
          Busca cualquier empresa cotizada del mundo y consulta su histórico de movimientos,
          zonas, percentiles y estadísticas.
        </p>
      </div>

      <UltimaConsulta />

      <CambiosRecientes cambios={datos.cambios} />

      <SectoresPrincipales sectores={datos.sectores} />

      <p className="v3-aviso" style={{ marginTop: '60px' }}>
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
        recomendación de inversión.
      </p>
    </main>
  );
}
