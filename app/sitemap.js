import { supabase } from '../lib/supabase';

const BASE_URL = 'https://v3-rho-weld.vercel.app';

function slugEmpresa(e) {
  const nombreLimpio = (e.nombre || e.ticker)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${e.ticker.toLowerCase()}__${nombreLimpio}`;
}

function slugSector(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function sitemap() {
  const estaticas = [
    '',
    '/empresas',
    '/sectores',
    '/posiciones',
    '/noticias',
    '/metodologia',
    '/fuentes',
    '/aviso-legal',
    '/privacidad',
    '/cookies',
    '/terminos',
    '/contacto'
  ].map((ruta) => ({
    url: `${BASE_URL}${ruta}`,
    lastModified: new Date(),
    changeFrequency: ruta === '' ? 'daily' : 'weekly',
    priority: ruta === '' ? 1 : 0.7
  }));

  const { data: empresas } = await supabase
    .from('empresas')
    .select('ticker, nombre, sector, updated_at')
    .limit(1000);

  const urlsEmpresas = (empresas || []).map((e) => ({
    url: `${BASE_URL}/analisis/${slugEmpresa(e)}`,
    lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8
  }));

  const sectoresSet = new Set(
    (empresas || []).map((e) => e.sector).filter(Boolean)
  );
  const urlsSectores = [...sectoresSet].map((s) => ({
    url: `${BASE_URL}/sectores/${slugSector(s)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6
  }));

  return [...estaticas, ...urlsEmpresas, ...urlsSectores];
}
