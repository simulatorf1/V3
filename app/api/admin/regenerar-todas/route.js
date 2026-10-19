import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { tokenValido } from '../../../../lib/admin';
import { generarAnalisis } from '../../../../lib/autogenerar';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
        const { data: cacheAnterior } = await supabaseAdmin
          .from('paginas')
          .select('datos')
          .eq('ticker', tickerUpper)
          .maybeSingle();

        if (cacheAnterior && cacheAnterior.datos) {
          let datosAntiguos = cacheAnterior.datos;
          if (typeof datosAntiguos === 'string') {
            try { datosAntiguos = JSON.parse(datosAntiguos); } catch (e) { datosAntiguos = null; }
          }
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
              datos: analisis,
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
