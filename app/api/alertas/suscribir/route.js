import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function generarToken() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  );
}

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, ticker, zonaObjetivo } = body;

    if (!email || !ticker) {
      return Response.json({ error: 'Faltan campos' }, { status: 400 });
    }

    if (zonaObjetivo !== 'alta' && zonaObjetivo !== 'baja') {
      return Response.json(
        { error: 'Pendiente objetivo no válida' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const tickerUpper = ticker.toUpperCase();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailLower)) {
      return Response.json({ error: 'Email no válido' }, { status: 400 });
    }

    let zonaActual = null;
    try {
      const { data: pagina } = await supabaseAdmin
        .from('paginas')
        .select('datos')
        .eq('ticker', tickerUpper)
        .maybeSingle();
      const datos = parseDatos(pagina?.datos);
      zonaActual = datos?.zona || null;
    } catch (e) {
      zonaActual = null;
    }

    const tokenConfirmacion = generarToken();
    const tokenBaja = generarToken();

    const { error } = await supabaseAdmin
      .from('alertas')
      .upsert(
        {
          email: emailLower,
          ticker: tickerUpper,
          tipo: 'cambio_zona',
          zona_objetivo: zonaObjetivo,
          zona_actual_al_suscribir: zonaActual,
          confirmado: false,
          token_confirmacion: tokenConfirmacion,
          token_baja: tokenBaja,
          ultima_enviada_at: null
        },
        { onConflict: 'email,ticker,tipo' }
      );

    if (error) {
      console.error('Error guardando alerta:', error);
      return Response.json(
        { error: 'No se pudo guardar la suscripción' },
        { status: 500 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const from = process.env.EMAIL_FROM;
    const siteUrl = process.env.SITE_URL || 'https://equaty.es';

    if (!apiKey || !from) {
      return Response.json(
        { error: 'Configuración de email incompleta' },
        { status: 500 }
      );
    }

    const linkConfirmar = `${siteUrl}/api/alertas/confirmar?token=${tokenConfirmacion}`;
    const linkBaja = `${siteUrl}/api/alertas/baja?token=${tokenBaja}`;

    const pendienteTexto =
      zonaObjetivo === 'baja' ? 'pendiente negativa' : 'pendiente positiva';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
        <h2 style="font-size: 20px; margin-bottom: 16px;">Confirma tu alerta para ${tickerUpper}</h2>
        <p style="font-size: 14px; line-height: 1.6;">
          Has solicitado recibir una notificación cuando <strong>${tickerUpper}</strong> cambie
          de pendiente y salga de la <strong>${pendienteTexto}</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          Pulsa el siguiente enlace para confirmar tu suscripción:
        </p>
        <p style="margin: 24px 0;">
          <a href="${linkConfirmar}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
            Confirmar alerta
          </a>
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #666;">
          Si no has solicitado esto, ignora este email. No recibirás nada más.
        </p>
        <p style="font-size: 12px; line-height: 1.6; color: #888; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
          Recibirás únicamente notificaciones informativas sobre cambios de pendiente en esta
          empresa. Puedes darte de baja en cualquier momento desde este enlace:
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
        to: [{ email: emailLower }],
        subject: `Confirma tu alerta para ${tickerUpper}`,
        htmlContent: emailHtml
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error Brevo:', errorText);
      return Response.json(
        { error: 'No se pudo enviar el email' },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/alertas/suscribir:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
