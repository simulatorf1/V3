import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

async function enviarEmailAlerta(apiKey, from, siteUrl, suscriptor, ticker, movimientoAnterior, movimientoNuevo, tokenBaja) {
  const linkBaja = `${siteUrl}/api/alertas/baja?token=${tokenBaja}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="font-size: 20px; margin-bottom: 16px;">Alerta Equaty: cambio en ${ticker}</h2>
      <p style="font-size: 14px; line-height: 1.6;">
        El último movimiento registrado de <strong>${ticker}</strong> ha pasado de
        <strong>${movimientoAnterior}</strong> a <strong>${movimientoNuevo}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6;">
        Puedes ver el análisis completo aquí:
      </p>
      <p style="margin: 24px 0;">
        <a href="${siteUrl}/analisis/${ticker.toLowerCase()}" style="background:#0b5fff;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
          Ver análisis
        </a>
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #888; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
        Recibes este correo porque lo solicitaste en equaty.es. Puedes darte de baja aquí: <a href="${linkBaja}" style="color: #888;">darme de baja</a>.
      </p>
      <p style="font-size: 11px; line-height: 1.6; color: #aaa; margin-top: 16px;">
        Este contenido es un registro estadístico elaborado por el equipo de Equaty. No es una recomendación de inversión.
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
      subject: `Alerta Equaty: cambio en ${ticker}`,
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
    .select('ticker, datos, ultimo_movimiento_cron');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let enviados = 0;
  let errores = 0;
  let cambiosGuardados = 0;

  for (const p of paginas || []) {
    let datos = p.datos;
    if (typeof datos === 'string') {
      try { datos = JSON.parse(datos); } catch (e) { continue; }
    }

    let senales = datos.senales;
    if (typeof senales === 'string') {
      try { senales = JSON.parse(senales); } catch (e) { senales = []; }
    }
    if (!Array.isArray(senales) || senales.length === 0) continue;

    const movimientoActual = senales[senales.length - 1].tipo;
    const movimientoCron = p.ultimo_movimiento_cron;

    // Si no hay referencia (primera vez), guardarla y no hacer nada
    if (!movimientoCron) {
      await supabaseAdmin
        .from('paginas')
        .update({ ultimo_movimiento_cron: movimientoActual })
        .eq('ticker', p.ticker);
      continue;
    }

    // Si no ha cambiado desde la última ejecución del cron, no hacer nada
    if (movimientoActual === movimientoCron) continue;

    // Hay cambio real: enviar emails
    const { data: suscriptores } = await supabaseAdmin
      .from('alertas')
      .select('email, token_baja')
      .eq('ticker', p.ticker)
      .eq('confirmado', true);

    for (const s of suscriptores || []) {
      const ok = await enviarEmailAlerta(apiKey, from, siteUrl, s, p.ticker, movimientoCron, movimientoActual, s.token_baja);
      if (ok) enviados++; else errores++;
    }

    // Guardar el cambio en la tabla
    await supabaseAdmin.from('cambios_movimiento').insert({
      ticker: p.ticker,
      movimiento_anterior: movimientoCron,
      movimiento_nuevo: movimientoActual
    });
    cambiosGuardados++;

    // Actualizar la referencia del cron
    await supabaseAdmin
      .from('paginas')
      .update({ ultimo_movimiento_cron: movimientoActual })
      .eq('ticker', p.ticker);
  }

  return Response.json({ ok: true, enviados, errores, cambiosGuardados });
}
