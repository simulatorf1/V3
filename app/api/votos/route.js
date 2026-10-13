import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return Response.json({ error: 'Falta ticker' }, { status: 400 });
  }

  const tickerUpper = ticker.toUpperCase();

  const { data, error } = await supabaseAdmin
    .from('votos')
    .select('opcion')
    .eq('ticker', tickerUpper);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const conteo = { seguimiento: 0, cartera: 0, fuera: 0 };
  for (const v of data || []) {
    if (conteo[v.opcion] !== undefined) conteo[v.opcion]++;
  }
  const total = conteo.seguimiento + conteo.cartera + conteo.fuera;

  let sentimiento = null;
  if (total > 0) {
    const max = Math.max(conteo.seguimiento, conteo.cartera, conteo.fuera);
    if (conteo.seguimiento === max) sentimiento = 'mayoritariamente en seguimiento';
    else if (conteo.cartera === max) sentimiento = 'mayoritariamente en cartera';
    else sentimiento = 'mayoritariamente fuera';
  }

  return Response.json({ conteo, total, sentimiento });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticker, opcion, cookie_id } = body;

    if (!ticker || !opcion || !cookie_id) {
      return Response.json({ error: 'Faltan campos' }, { status: 400 });
    }

    if (!['seguimiento', 'cartera', 'fuera'].includes(opcion)) {
      return Response.json({ error: 'Opción no válida' }, { status: 400 });
    }

    const tickerUpper = ticker.toUpperCase();

    // Upsert: si ya existe un voto con ese ticker+cookie_id, se actualiza
    const { error } = await supabaseAdmin
      .from('votos')
      .upsert(
        {
          ticker: tickerUpper,
          opcion,
          cookie_id
        },
        { onConflict: 'ticker,cookie_id' }
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Devolvemos el conteo actualizado
    const { data } = await supabaseAdmin
      .from('votos')
      .select('opcion')
      .eq('ticker', tickerUpper);

    const conteo = { seguimiento: 0, cartera: 0, fuera: 0 };
    for (const v of data || []) {
      if (conteo[v.opcion] !== undefined) conteo[v.opcion]++;
    }
    const total = conteo.seguimiento + conteo.cartera + conteo.fuera;

    let sentimiento = null;
    if (total > 0) {
      const max = Math.max(conteo.seguimiento, conteo.cartera, conteo.fuera);
      if (conteo.seguimiento === max) sentimiento = 'mayoritariamente en seguimiento';
      else if (conteo.cartera === max) sentimiento = 'mayoritariamente en cartera';
      else sentimiento = 'mayoritariamente fuera';
    }

    return Response.json({ ok: true, conteo, total, sentimiento });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
