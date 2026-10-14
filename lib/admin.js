import { cookies } from 'next/headers';

const COOKIE_ADMIN = 'v3_admin_token';

export function getPasswordEsperada() {
  return process.env.ADMIN_PASSWORD || null;
}

// Genera un token simple a partir de la contraseña.
// No es criptográficamente fuerte, pero para un panel privado es suficiente.
function generarToken(password) {
  let hash = 0;
  const str = 'v3' + password + 'admin';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'v3_' + Math.abs(hash).toString(36);
}

export function tokenValido() {
  const password = getPasswordEsperada();
  if (!password) return false;
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ADMIN)?.value;
  if (!token) return false;
  return token === generarToken(password);
}

export function generarTokenDesdePassword(password) {
  return generarToken(password);
}

export const NOMBRE_COOKIE_ADMIN = COOKIE_ADMIN;
