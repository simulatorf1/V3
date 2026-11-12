import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';
import { generarAnalisis } from '../../../../lib/autogenerar';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

function mergeVelas(prevVelas, nextVelas) {
  if (!Array.isArray(prevVelas) || prevVelas.length === 0) {
    return Array.isArray(nextVelas) ? nextVelas : [];
  }
  if (!Array.isArray(nextVelas) || nextVelas.length === 0) {
    return prevVelas;
  }
  const mapa = new Map();
  for (const v of prevVelas) {
    if (v && v.date) mapa.set(v.date, v);
  }
  for (const v of nextVelas) {
    if (v && v.date) mapa.set(v.date, v);
  }
  return Array.from(mapa.values()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function mergeAnalisisSimple(prev, next) {
  if (!prev) return next;
  if (!next) return prev;

  const velasFusionadas = mergeVelas(prev.velasUltimas60, next.velasUltimas60);
  const velasCambiaron = velasFusionadas.length !== (next.velasUltimas60?.length || 0);

  let smisFusionados = next.smisUltimos60;
  if (velasCambiaron && Array.isArray(next.smisUltimos60)) {
    if (Array.isArray(prev.smisUltimos60) && prev.smisUltimos60.length >= velasFusionadas.length) {
      smisFusionados = prev.smisUltimos60.slice(-velasFusionadas.length);
    }
  }

  return {
    ...next,
    velasUltimas60: velasFusionadas,
    smisUltimos60: smisFusionados,
    precioActual:
      velasFusionadas.length > 0
        ? velasFusionadas[velasFusionadas.length - 1].close
        : next.precioActual ?? prev.precioActual ?? null,
    velasSemanales:
      Array.isArray(next.velasSemanales) && next.velasSemanales.length
        ? next.velasSemanales
        : prev.velasSemanales || [],
    smisSemanales:
      Array.isArray(next.smisSemanales) && next.smisSemanales.length
        ? next.smisSemanales
        : prev.smisSemanales || [],
    smiSemanalActual: next.smiSemanalActual ?? prev.smiSemanalActual ?? null,
    zonaSemanal: next.zonaSemanal ?? prev.zonaSemanal ?? null,
    noticias:
      Array.isArray(next.noticias) && next.noticias.length
        ? next.noticias
        : prev.noticias || [],
    sectorInfo: next.sectorInfo ?? prev.sectorInfo ?? null,
    fundamentales: next.fundamentales ?? prev.fundamentales ?? null
  };
}

export async function POST(request) {
  if (!tokenValido()) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tickers } = body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return Response.json({ error: 'Faltan tickers' }, { status: 400 });
    }

    if (tickers.length > 1) {
      return Response.json(
        {
          error:
            'Solo se permite regenerar 1 ticker por llamada. Para el resto, espera al caché de 6h o al cron diario.'
        },
        { status: 400 }
      );
    }

    const resultados = [];

    for (const ticker of tickers) {
      const tickerUpper = ticker.toUpperCase();

      const { data: empresa } = await supabaseAdmin
        .from('empresas')
        .select('*')
        .eq('ticker', tickerUpper)
        .maybeSingle();

      if (!empresa) {
        resultados.push({ ticker: tickerUpper, ok: false, error: 'Empresa no encontrada' });
        continue;
      }

      try {
        const analisis = await generarAnalisis(tickerUpper, empresa);

        let movimientoAnterior = null;
        let datosAntiguos = null;
        const { data: cacheAnterior } = await supabaseAdmin
          .from('paginas')
          .select('datos')
          .eq('ticker', tickerUpper)
          .maybeSingle();

        if (cacheAnterior && cacheAnterior.datos) {
          datosAntiguos = parseDatos(cacheAnterior.datos);
          if (datosAntiguos) {
            let senalesAntiguas = datosAntiguos.senales;
            if (typeof senalesAntiguas === 'string') {
              try { senalesAntiguas = JSON.parse(senalesAntiguas); } catch (e) { senalesAntiguas = []; }
            }
            if (Array.isArray(senalesAntiguas) && senalesAntiguas.length > 0) {
              movimientoAnterior = senalesAntiguas[senalesAntiguas.length - 1].tipo || null;
            }
          }
        }

        const final = mergeAnalisisSimple(datosAntiguos, analisis);

        const slug = `${tickerUpper.toLowerCase()}__${empresa.nombre
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')}`;

        const { error: errUpsert } = await supabaseAdmin
          .from('paginas')
          .upsert(
            {
              empresa_id: empresa.id,
              ticker: tickerUpper,
              slug,
              datos: final,
              ultimo_movimiento_anterior: movimientoAnterior,
              actualizado_at: new Date().toISOString()
            },
            { onConflict: 'ticker' }
          );

        if (errUpsert) {
          resultados.push({ ticker: tickerUpper, ok: false, error: errUpsert.message });
        } else {
          resultados.push({ ticker: tickerUpper, ok: true });
        }
      } catch (e) {
        resultados.push({ ticker: tickerUpper, ok: false, error: e.message });
      }
    }

    return Response.json({ ok: true, resultados });
  } catch (err) {
    console.error('Error en regenerar-todas:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
