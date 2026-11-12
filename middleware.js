import { NextResponse } from 'next/server';

export function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const method = request.method;

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
    'redditbot',
    'mj12bot',
    'ahrefsbot',
    'semrushbot',
    'dotbot',
    'petalbot',
    'bytespider',
    'gptbot',
    'chatgpt',
    'claude',
    'anthropic',
    'ccbot',
    'blexbot',
    'seznam',
    'yandex',
    'baidu',
    'sogou',
    'exabot',
    'ia_archiver',
    'archive.org_bot',
    'uptimerobot',
    'pingdom',
    'statuscake',
    'site24x7',
    'newrelic',
    'datadog'
  ];

  const esBotBloqueado = botsBloqueados.some((bot) =>
    ua.toLowerCase().includes(bot)
  );

  if (esBotBloqueado) {
    return new NextResponse(null, { status: 403 });
  }

  if (method === 'HEAD' && ua.includes('Chrome/')) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/analisis/:path*'
};
