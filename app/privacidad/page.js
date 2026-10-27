import GraficoPrecedentes from '../../components/GraficoPrecedentes';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Política de Privacidad — Equaty',
  description: 'Política de privacidad de Equaty.'
};

function parseDatos(datos) {
  if (!datos) return null;
  if (typeof datos === 'string') {
    try {
      return JSON.parse(datos);
    } catch (e) {
      return null;
    }
  }
  return datos;
}

async function cargarDatosPrueba(ticker) {
  try {
    const { data } = await supabase
      .from('paginas')
      .select('datos')
      .eq('ticker', ticker)
      .maybeSingle();

    const datos = parseDatos(data?.datos);
    if (!datos) return null;

    return {
      velas: datos.velasUltimas60 || [],
      smis: datos.smisUltimos60 || [],
      smiActual: datos.smiActual ?? null
    };
  } catch (e) {
    console.error('[privacidad] Error cargando datos de prueba:', e.message);
    return null;
  }
}

export default async function Privacidad() {
  const datosPrueba = await cargarDatosPrueba('SLR.MC');

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

      {datosPrueba && datosPrueba.velas.length > 0 && (
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '2px dashed #e5e7eb' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>
            — Zona de pruebas (temporal) —
          </p>
          <GraficoPrecedentes
            velas={datosPrueba.velas}
            smis={datosPrueba.smis}
            smiActual={datosPrueba.smiActual}
          />
        </div>
      )}
    </main>
  );
}
