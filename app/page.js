import Link from 'next/link';
import Buscador from '../components/Buscador';
import CambiosRecientes from '../components/CambiosRecientes';
import SectoresPrincipales from '../components/SectoresPrincipales';
import MovimientosHoyCliente from '../components/MovimientosHoyCliente';
import RankingTabla from '../components/RankingTabla';
import ListaExtremos from '../components/ListaExtremos';
import ListaCambiosZona from '../components/ListaCambiosZona';
import MapaCalorSector from '../components/MapaCalorSector';
import { supabase } from '../lib/supabase';

export const dynamic = 'force-dynamic';

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

function calcularVariacion(velas, sesiones) {
  if (!velas || velas.length < sesiones + 1) return null;
  const primero = velas[velas.length - sesiones - 1]?.close;
  const ultimo = velas[velas.length - 1]?.close;
  if (!primero) return null;
  return ((ultimo - primero) / primero) * 100;
}

function calcularPercentil(smis, smiActual) {
  if (!smis || smis.length === 0 || smiActual === null || smiActual === undefined) return null;
  const validos = smis.filter((v) => v !== null && v !== undefined);
  if (validos.length === 0) return null;
  const menores = validos.filter((v) => v < smiActual).length;
  return Math.round((menores / validos.length) * 100);
}

async function cargarDatos() {
  const vacio = { cambios: [], sectores: [], ranking: [], extremosAltos: [], extremosBajos: [], cambiosZona: [], mapaSector: [] };

  try {
    const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [paginasRes, empresasRes, cambiosRes] = await Promise.all([
      supabase
        .from('paginas')
        .select('ticker, datos, actualizado_at')
        .order('actualizado_at', { ascending: false })
        .limit(300),
      supabase.from('empresas').select('ticker, nombre, sector'),
      supabase
        .from('cambios_movimiento')
        .select('ticker, movimiento_anterior, movimiento_nuevo, detectado_at')
        .gte('detectado_at', hace24h)
        .order('detectado_at', { ascending: false })
        .limit(15)
    ]);

    const paginas = paginasRes?.data || [];
    const empresas = empresasRes?.data || [];
    const cambiosZonaRaw = cambiosRes?.data || [];

    const empresasMap = {};
    for (const e of empresas) {
      if (e && e.ticker) empresasMap[e.ticker] = e;
    }

    const cambios = [];
    const ranking = [];
    const extremosAltos = [];
    const extremosBajos = [];

    for (const p of paginas) {
      const datos = parseDatos(p.datos);
      if (!datos) continue;
      const emp = empresasMap[p.ticker];
      if (!emp) continue;

      const velas = datos.velasUltimas60 || [];
      const smis = datos.smisUltimos60 || [];
      const smiActual = datos.smiActual;
      const variacion5 = calcularVariacion(velas, 5);
      const variacion60 = calcularVariacion(velas, 60);
      const percentil = calcularPercentil(smis, smiActual);

      const item = {
        ticker: p.ticker,
        nombre: emp.nombre,
        sector: emp.sector,
        precio: datos.precioActual,
        zona: datos.zona,
        variacion5,
        variacion60,
        percentil
      };

      ranking.push(item);

      if (percentil !== null) {
        if (percentil >= 90) extremosAltos.push(item);
        if (percentil <= 10) extremosBajos.push(item);
      }

      if (p.actualizado_at >= hace48h) {
        cambios.push({
          ticker: p.ticker,
          nombre: emp.nombre,
          sector: emp.sector,
          precio: datos.precioActual,
          zona: datos.zona,
          percentil
        });
      }
    }

    ranking.sort((a, b) => {
      if (a.variacion60 === null) return 1;
      if (b.variacion60 === null) return -1;
      return b.variacion60 - a.variacion60;
    });

    extremosAltos.sort((a, b) => b.percentil - a.percentil);
    extremosBajos.sort((a, b) => a.percentil - b.percentil);

    const cambiosZona = cambiosZonaRaw.map((c) => ({
      ticker: c.ticker,
      nombre: empresasMap[c.ticker]?.nombre || c.ticker,
      sector: empresasMap[c.ticker]?.sector || null,
      categoriaAnterior: c.movimiento_anterior === 'venta' ? 'A' : c.movimiento_anterior === 'compra' ? 'C' : 'B',
      categoriaNueva: c.movimiento_nuevo === 'venta' ? 'A' : c.movimiento_nuevo === 'compra' ? 'C' : 'B'
    }));

    const conteoSectores = {};
    for (const e of empresas) {
      if (!e || !e.sector) continue;
      conteoSectores[e.sector] = (conteoSectores[e.sector] || 0) + 1;
    }
    const sectores = Object.entries(conteoSectores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([sector, empresas]) => ({ sector, empresas }));

    const sectorTop = sectores[0]?.sector;
    const mapaSector = sectorTop
      ? ranking.filter((r) => r.sector === sectorTop).slice(0, 20)
      : [];

    return {
      cambios: cambios.slice(0, 12),
      sectores,
      ranking: ranking.slice(0, 15),
      extremosAltos: extremosAltos.slice(0, 8),
      extremosBajos: extremosBajos.slice(0, 8),
      cambiosZona,
      mapaSector,
      sectorTop
    };
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

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
        <Link
          href="/hoy"
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
          Ver resumen de hoy →
        </Link>
      </div>

      <RankingTabla
        items={datos.ranking}
        tipo="variacion60"
        titulo="Top 15 por variación en 60 sesiones"
      />

      <ListaCambiosZona cambios={datos.cambiosZona} />

      <ListaExtremos altos={datos.extremosAltos} bajos={datos.extremosBajos} />

      {datos.sectorTop && (
        <MapaCalorSector items={datos.mapaSector} sector={datos.sectorTop} />
      )}

      <MovimientosHoyCliente />

      <CambiosRecientes cambios={datos.cambios} />

      <SectoresPrincipales sectores={datos.sectores} />

      <p className="v3-aviso" style={{ marginTop: '60px' }}>
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
        recomendación de inversión.
      </p>
    </main>
  );
}
