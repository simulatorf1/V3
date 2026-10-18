import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(request) {
  const siteUrl = process.env.SITE_URL || 'https://equaty.es';
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.redirect(`${siteUrl}/alertas/confirmada?estado=error`, 302);
    }

    const { data: alerta, error } = await supabaseAdmin
      .from('alertas')
      .select('id, confirmado')
      .eq('token_confirmacion', token)
      .maybeSingle();

    if (error || !alerta) {
      return Response.redirect(`${siteUrl}/alertas/confirmada?estado=error`, 302);
    }

    if (alerta.confirmado) {
      return Response.redirect(`${siteUrl}/alertas/confirmada?estado=ya`, 302);
    }

    const { error: errUpdate } = await supabaseAdmin
      .from('alertas')
      .update({
        confirmado: true,
        confirmado_at: new Date().toISOString()
      })
      .eq('id', alerta.id);

    if (errUpdate) {
      return Response.redirect(`${siteUrl}/alertas/confirmada?estado=error`, 302);
    }

    return Response.redirect(`${siteUrl}/alertas/confirmada?estado=ok`, 302);
  } catch (err) {
    console.error('Error en /api/alertas/confirmar:', err);
    return Response.redirect(`${siteUrl}/alertas/confirmada?estado=error`, 302);
  }
}
