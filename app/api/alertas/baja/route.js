import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(request) {
  const siteUrl = process.env.SITE_URL || 'https://equaty.es';
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.redirect(`${siteUrl}/alertas/baja?estado=error`, 302);
    }

    const { data: alerta, error } = await supabaseAdmin
      .from('alertas')
      .select('id')
      .eq('token_baja', token)
      .maybeSingle();

    if (error || !alerta) {
      return Response.redirect(`${siteUrl}/alertas/baja?estado=error`, 302);
    }

    const { error: errDelete } = await supabaseAdmin
      .from('alertas')
      .delete()
      .eq('id', alerta.id);

    if (errDelete) {
      return Response.redirect(`${siteUrl}/alertas/baja?estado=error`, 302);
    }

    return Response.redirect(`${siteUrl}/alertas/baja?estado=ok`, 302);
  } catch (err) {
    console.error('Error en /api/alertas/baja:', err);
    return Response.redirect(`${siteUrl}/alertas/baja?estado=error`, 302);
  }
}
