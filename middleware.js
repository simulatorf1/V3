import { NextResponse } from 'next/server';

export function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const method = request.method;

  // Bloquear bots de redes sociales y rastreadores que no aportan tráfico
  const botsBloqueados = [
    'meta-webindexer',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegram',
    'slack',
    'discord',
    'pinterest',
    'redditbot'
  ];

  const esBotBloqueado = botsBloqueados.some((bot) =>
    ua.toLowerCase().includes(bot)
  );

  if (esBotBloqueado) {
    return new NextResponse(null, { status: 403 });
  }

  // Bloquear peticiones HEAD que se disfrazan de Chrome (bot de San Francisco)
  if (method === 'HEAD' && ua.includes('Chrome/')) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/analisis/:path*'
};
