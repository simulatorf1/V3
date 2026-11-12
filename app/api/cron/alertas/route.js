import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function pendienteDesdeMovimiento(movimiento) {
  if (movimiento === 'venta') return 'positiva';
  if (movimiento === 'compra') return 'negativa';
  return 'neutra';
}

async function enviarEmailCambioPendiente(
  apiKey,
  from,
  siteUrl,
  suscriptor,
  ticker,
  pendienteAnterior,
  pendienteNueva,
  tokenBaja
) {
  const linkBaja = `${siteUrl}/api/alertas/baja?token=${tokenBaja}`;

  const pendienteTextoAnterior = `pendiente ${pendienteAnterior}`;
  const pendienteTextoNueva = `pendiente ${pendienteNueva}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="font-size: 20px; margin-bottom: 16px;">Alerta Equaty: cambio de pendiente en ${ticker}</h2>
      <p style="font-size: 14px; line-height: 1.6;">
        El indicador Equaty de <strong>${ticker}</strong> ha cambiado de pendiente: ha pasado de
        <strong>${pendienteTextoAnterior}</strong> a <strong>${pendienteTextoNueva}</strong>.
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
      subject: `Alerta Equaty: cambio de pendiente en ${ticker}`,
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

/**
 * Dado [s2, s1, s0], devuelve:
 * - 'compra' si la pendiente pasa de negativa a positiva
 * - 'venta' si pasa de positiva a negativa
 * - null si no cambia
 */
function movimientoDesdeSmis3(smis3) {
  if (!Array.isArray(smis3) || smis3.length < 3) return null;
  if (!smis3.every((v) => v !== null && v !== undefined)) return null;

  const [s2, s1, s0] = smis3;
  const pendActual = s0 - s1;
  const pendAnterior = s1 - s2;

  if (pendAnterior <= 0 && pendActual > 0) return 'compra';
  if (pendAnterior >= 0 && pendActual < 0) return 'venta';
  return null;
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

  // Solo leemos columnas ligeras (smi_ultimos_3), no el JSON datos
  const { data: paginas, error } = await supabaseAdmin
    .from('paginas')
    .select('ticker, smi_ultimos_3, ultimo_movimiento_anterior')
    .not('ultimo_movimiento_anterior', 'is', null);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let enviados = 0;
  let errores = 0;
  let cambiosGuardados = 0;
  let inicializados = 0;

  for (const p of paginas || []) {
    const movimientoActual = movimientoDesdeSmis3(p.smi_ultimos_3);
    if (!movimientoActual) continue;

    const movimientoAyer = p.ultimo_movimiento_anterior;

    if (movimientoActual === movimientoAyer) continue;

    const pendienteAnterior = pendienteDesdeMovimiento(movimientoAyer);
    const pendienteNueva = pendienteDesdeMovimiento(movimientoActual);

    const zonaAnterior = movimientoAyer === 'venta' ? 'alta' : 'baja';
    const { data: suscriptores } = await supabaseAdmin
      .from('alertas')
      .select('email, token_baja, zona_objetivo, ultima_enviada_at')
      .eq('ticker', p.ticker)
      .eq('confirmado', true)
      .eq('tipo', 'cambio_zona')
      .eq('zona_objetivo', zonaAnterior);

    for (const s of suscriptores || []) {
      const ok = await enviarEmailCambioPendiente(
        apiKey,
        from,
        siteUrl,
        s,
        p.ticker,
        pendienteAnterior,
        pendienteNueva,
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

    await supabaseAdmin.from('cambios_movimiento').insert({
      ticker: p.ticker,
      movimiento_anterior: movimientoAyer,
      movimiento_nuevo: movimientoActual
    });
    cambiosGuardados++;

    await supabaseAdmin
      .from('paginas')
      .update({ ultimo_movimiento_anterior: movimientoActual })
      .eq('ticker', p.ticker);
  }

  // Inicializar las que no tienen ultimo_movimiento_anterior (solo la primera vez)
  // Leemos smi_ultimos_3, no datos
  if (inicializados === 0) {
    const { data: sinInicializar } = await supabaseAdmin
      .from('paginas')
      .select('ticker, smi_ultimos_3')
      .is('ultimo_movimiento_anterior', null)
      .limit(100);

    for (const p of sinInicializar || []) {
      const movimientoActual = movimientoDesdeSmis3(p.smi_ultimos_3);
      if (!movimientoActual) continue;
      await supabaseAdmin
        .from('paginas')
        .update({ ultimo_movimiento_anterior: movimientoActual })
        .eq('ticker', p.ticker);
      inicializados++;
    }
  }

  return Response.json({
    ok: true,
    enviados,
    errores,
    cambiosGuardados,
    inicializados
  });
}
