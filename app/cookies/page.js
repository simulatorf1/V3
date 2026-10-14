export const metadata = {
  title: 'Política de Cookies — V3',
  description: 'Política de cookies de V3.'
};

export default function Cookies() {
  return (
    <main className="v3-container" style={{ maxWidth: '820px' }}>
      <h1>Política de Cookies</h1>

      <p>
        Este sitio utiliza un número reducido de cookies, todas ellas con finalidad funcional o
        estadística anónima.
      </p>

      <h2>Cookies propias</h2>
      <ul>
        <li>
          <strong>v3_cookie_id:</strong> identificador anónimo para que el usuario no repita su voto
          en el consenso de la comunidad. Duración: 1 año.
        </li>
        <li>
          <strong>v3_voto_[ticker]:</strong> almacena el voto realizado por el usuario sobre una
          empresa concreta. Duración: 1 año.
        </li>
        <li>
          <strong>v3_ultima_empresa:</strong> guarda el último ticker consultado para mostrarlo en
          la página principal. Duración: 1 año.
        </li>
      </ul>

      <h2>Cookies de terceros</h2>
      <ul>
        <li>
          <strong>Google AdSense:</strong> puede instalar cookies para personalizar los anuncios.
          El usuario puede gestionarlas desde <em>adssettings.google.com</em>.
        </li>
      </ul>

      <h2>Cómo desactivarlas</h2>
      <p>
        Puede bloquear o eliminar las cookies desde la configuración de su navegador. El bloqueo de
        las cookies funcionales no impide el acceso al contenido, pero puede afectar al
        funcionamiento del consenso de la comunidad.
      </p>
    </main>
  );
}
