import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    if (!id) return Response.json({ error: 'Falta id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('comentarios').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  // Marcar como spam (aprobado = false, se oculta pero se queda)
  try {
    const id = params.id;
    if (!id) return Response.json({ error: 'Falta id' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('comentarios')
      .update({ aprobado: false })
      .eq('id', id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  // Editar texto
  try {
    const id = params.id;
    if (!id) return Response.json({ error: 'Falta id' }, { status: 400 });

    const body = await request.json();
    const { texto } = body;
    if (!texto || texto.trim().length < 2) {
      return Response.json({ error: 'Texto no válido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('comentarios')
      .update({ texto: texto.trim() })
      .eq('id', id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
