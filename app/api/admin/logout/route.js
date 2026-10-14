import { NOMBRE_COOKIE_ADMIN } from '../../../../lib/admin';

export async function POST() {
  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `${NOMBRE_COOKIE_ADMIN}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers
  });
}
