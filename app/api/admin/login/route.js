import {
  getPasswordEsperada,
  generarTokenDesdePassword,
  NOMBRE_COOKIE_ADMIN
} from '../../../../lib/admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    const passwordEsperada = getPasswordEsperada();
    if (!passwordEsperada) {
      return Response.json({ error: 'Panel no configurado' }, { status: 500 });
    }

    if (!password || password !== passwordEsperada) {
      return Response.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const token = generarTokenDesdePassword(passwordEsperada);

    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      `${NOMBRE_COOKIE_ADMIN}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
