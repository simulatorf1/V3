import Buscador from '../components/Buscador';
import UltimaConsulta from '../components/UltimaConsulta';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import MovimientosHoy from '../components/MovimientosHoy';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

function calcularCiclos(senales, precioActual) {
  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const limitada = lista.slice(-100);

  return limitada.map((s, i) => {
    const siguiente = limitada[i + 1];
    const precioCierre = siguiente ? siguiente.precio : precioActual;
    const variacion = precioCierre ? ((precioCierre - s.precio) / s.precio) * 100 : 0;

    let acierto = null;
    if (variacion !== 0) {
      if (s.tipo === 'compra') acierto = variacion > 0;
      else if (s.tipo === 'venta') acierto = variacion < 0;
    }

    return { tipo: s.tipo, acierto };
  });
}

function analizarEstadistica(senales, precioActual) {
  const ciclos = calcularCiclos(senales, precioActual);
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

  return {
    compras: analizar(compras),
    ventas: analizar(ventas)
  };
}

async function cargarDatos() {
  const vacio = { cambios: [], sectores: [], movimientos: [] };

  try {
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [paginasRes, empresasRes] = await Promise.all([
      supabase
        .from('paginas')
        .select('ticker, datos, actualizado_at, ultimo_movimiento_anterior')
        .gte('actualizado_at', hace48h)
        .order('actualizado_at', { ascending: false })
        .limit(30),
      supabase.from('empresas').select('ticker, nombre, sector')
    ]);

    const paginas = paginasRes?.data || [];
    const empresas = empresasRes?.data || [];

    const empresasMap = {};
    for (const e of empresas) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const cambios = [];
    const movimientos = [];

    for (const p of paginas) {
      if (!p || !p.datos) continue;
      const emp = empresasMap[p.ticker];
      if (!emp) continue;

      let datos = p.datos;
      if (typeof datos === 'string') {
        try { datos = JSON.parse(datos); } catch (e) { continue; }
      }

      let senales = datos.senales;
      if (typeof senales === 'string') {
        try { senales = JSON.parse(senales); } catch (e) { senales = []; }
      }

      const stats = analizarEstadistica(senales || [], datos.precioActual);

      cambios.push({
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        precio: datos.precioActual,
        stats
      });

      // Movimientos: cambios en las últimas 24h
      const ultima = Array.isArray(senales) && senales.length > 0
        ? senales[senales.length - 1]
        : null;
      const movActual = ultima ? ultima.tipo : null;

      if (
        p.actualizado_at >= hace24h &&
        p.ultimo_movimiento_anterior &&
        movActual &&
        p.ultimo_movimiento_anterior !== movActual
      ) {
        movimientos.push({
          ticker: p.ticker,
          nombre: emp.nombre,
          sector: emp.sector,
          movimientoAnterior: p.ultimo_movimiento_anterior,
          movimientoNuevo: movActual
        });
      }
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

    return { cambios, sectores, movimientos };
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

      <MovimientosHoy cambios={datos.movimientos} />

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
