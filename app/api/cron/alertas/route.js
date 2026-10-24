import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

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

function zonaDesdeMovimiento(movimiento) {
  if (movimiento === 'venta') return 'alta';
  if (movimiento === 'compra') return 'baja';
  return 'intermedia';
}

async function enviarEmailCambioZona(
  apiKey,
  from,
  siteUrl,
  suscriptor,
  ticker,
  zonaAnterior,
  zonaNueva,
  tokenBaja
) {
  const linkBaja = `${siteUrl}/api/alertas/baja?token=${tokenBaja}`;

  const zonaTextoAnterior = zonaAnterior === 'alta' ? 'parte alta' : 'parte baja';
  const zonaTextoNueva = zonaNueva === 'alta' ? 'parte alta' : 'parte baja';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="font-size: 20px; margin-bottom: 16px;">Alerta Equaty: cambio de zona en ${ticker}</h2>
      <p style="font-size: 14px; line-height: 1.6;">
        <strong>${ticker}</strong> ha cambiado de zona en su rango de 60 sesiones: ha pasado de
        la <strong>${zonaTextoAnterior}</strong> a la <strong>${zonaTextoNueva}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6;">
        Puedes ver la ficha completa aquí:
      </p>
      <p style="margin: 24px 0;">
        <a href="${siteUrl}/analisis/${ticker.toLowerCase()}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
          Ver ficha
        </a>
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #888; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
        Recibes este correo porque lo solicitaste en equaty.es. Puedes darte de baja aquí:
        <a href="${linkBaja}" style="color: #888;">darme de baja</a>.
      </p>
      <p style="font-size: 11px; line-height: 1.6; color: #aaa; margin-top: 16px;">
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una
        recomendación de inversión.
      </p>
    </div>
  `;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { email: from, name: 'Equaty' },
      to: [{ email: suscriptor.email }],
      subject: `Alerta Equaty: cambio de zona en ${ticker}`,
      htmlContent: emailHtml
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Error Brevo enviando a ${suscriptor.email}:`, errorText);
    return false;
  }
  return true;
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  const siteUrl = process.env.SITE_URL || 'https://equaty.es';

  if (!apiKey || !from) {
    return Response.json({ error: 'Configuración incompleta' }, { status: 500 });
  }

  const { data: paginas, error } = await supabaseAdmin
    .from('paginas')
    .select('ticker, datos, ultimo_movimiento_anterior');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let enviados = 0;
  let errores = 0;
  let cambiosGuardados = 0;
  let inicializados = 0;

  for (const p of paginas || []) {
    const datos = parseDatos(p.datos);
    if (!datos) continue;

    let senales = datos.senales;
    if (typeof senales === 'string') {
      try {
        senales = JSON.parse(senales);
      } catch (e) {
        senales = [];
      }
    }
    if (!Array.isArray(senales) || senales.length === 0) continue;

    const movimientoActual = senales[senales.length - 1].tipo;
    const movimientoAyer = p.ultimo_movimiento_anterior;

    // Primera vez: inicializar sin enviar email
    if (!movimientoAyer) {
      await supabaseAdmin
        .from('paginas')
        .update({ ultimo_movimiento_anterior: movimientoActual })
        .eq('ticker', p.ticker);
      inicializados++;
      continue;
    }

    // Sin cambio desde ayer: no hacer nada
    if (movimientoActual === movimientoAyer) continue;

    const zonaAnterior = zonaDesdeMovimiento(movimientoAyer);
    const zonaNueva = zonaDesdeMovimiento(movimientoActual);

    // Buscar suscriptores que quieren aviso cuando salga de la zona anterior
    const { data: suscriptores } = await supabaseAdmin
      .from('alertas')
      .select('email, token_baja, zona_objetivo, ultima_enviada_at')
      .eq('ticker', p.ticker)
      .eq('confirmado', true)
      .eq('tipo', 'cambio_zona')
      .eq('zona_objetivo', zonaAnterior);

    for (const s of suscriptores || []) {
      const ok = await enviarEmailCambioZona(
        apiKey,
        from,
        siteUrl,
        s,
        p.ticker,
        zonaAnterior,
        zonaNueva,
        s.token_baja
      );
      if (ok) {
        enviados++;
        await supabaseAdmin
          .from('alertas')
          .update({ ultima_enviada_at: new Date().toISOString() })
          .eq('email', s.email)
          .eq('ticker', p.ticker)
          .eq('tipo', 'cambio_zona');
      } else {
        errores++;
      }
    }

    // Guardar el cambio en cambios_movimiento (para el home y /hoy)
    await supabaseAdmin.from('cambios_movimiento').insert({
      ticker: p.ticker,
      movimiento_anterior: movimientoAyer,
      movimiento_nuevo: movimientoActual
    });
    cambiosGuardados++;

    // Actualizar "ayer" con el movimiento actual
    await supabaseAdmin
      .from('paginas')
      .update({ ultimo_movimiento_anterior: movimientoActual })
      .eq('ticker', p.ticker);
  }

  return Response.json({
    ok: true,
    enviados,
    errores,
    cambiosGuardados,
    inicializados
  });
}
