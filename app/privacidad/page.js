export const metadata = {
  title: 'Política de Privacidad — Equaty',
  description: 'Política de privacidad de Equaty.'
};

export default function Privacidad() {
  return (
    <main className="v3-container" style={{ maxWidth: '820px' }}>
      <h1>Política de Privacidad</h1>

      <p>
        Equaty no requiere registro ni creación de cuentas. No se recopilan datos personales para el
        uso general del sitio.
      </p>

      <h2>Datos que tratamos</h2>
      <ul>
        <li>
          <strong>Cookies funcionales:</strong> un identificador anónimo para no repetir el voto en
          el consenso de la comunidad y para recordar la última empresa consultada. Estas cookies
          se almacenan únicamente en su navegador.
        </li>
        <li>
          <strong>Datos de uso anónimos:</strong> registramos las rutas consultadas, la fecha y un
          país aproximado para elaborar estadísticas internas. No se asocian a ninguna identidad.
        </li>
        <li>
          <strong>Alertas por email (opcional):</strong> si el usuario se suscribe, se guarda su
          dirección de correo con doble opt-in y puede darse de baja en cualquier momento.
        </li>
      </ul>

      <h2>Base legal</h2>
      <ul>
        <li>Consentimiento del usuario (RGPD, art. 6.1.a).</li>
        <li>Interés legítimo en la seguridad y funcionamiento del servicio (RGPD, art. 6.1.f).</li>
      </ul>

      <h2>Conservación</h2>
      <p>
        Los datos de uso anónimos se conservan durante un máximo de 12 meses. Los emails de alerta
        se conservan hasta que el usuario solicita la baja.
      </p>

      <h2>Derechos del usuario</h2>
      <p>
        Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y
        portabilidad escribiendo al formulario de contacto del sitio.
      </p>

      <h2>Publicidad</h2>
      <p>
        Este sitio puede mostrar anuncios proporcionados por Google AdSense. Google puede usar
        cookies propias para personalizar los anuncios. El usuario puede gestionar sus preferencias
        en la configuración de anuncios de Google.
      </p>
    </main>
  );
}
