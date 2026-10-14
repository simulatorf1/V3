export const metadata = {
  title: 'Metodología — V3',
  description: 'Cómo se generan los análisis estadísticos de V3.'
};

export default function Metodologia() {
  return (
    <main className="v3-container" style={{ maxWidth: '820px' }}>
      <h1>Metodología</h1>

      <p>
        Esta web genera análisis estadísticos automatizados sobre empresas cotizadas a partir de
        series históricas de mercado. Ninguna parte del contenido se elabora manualmente.
      </p>

      <h2>Fuentes de datos</h2>
      <ul>
        <li>Precios históricos OHLCV: Yahoo Finance (API pública).</li>
        <li>Noticias: agregadores públicos (Yahoo Finance News).</li>
        <li>Referencias sectoriales: ETFs cotizados en mercados de EE. UU.</li>
      </ul>

      <h2>Periodicidad de actualización</h2>
      <ul>
        <li>Los análisis se regeneran bajo demanda y se guardan en caché durante 60 minutos.</li>
        <li>Los datos de mercado corresponden al cierre de la sesión más reciente disponible.</li>
      </ul>

      <h2>Indicador propietario</h2>
      <p>
        El indicador propietario es una variante del Stochastic Momentum Index de William Blau.
        Mide la posición del precio de cierre respecto al rango de las últimas 10 sesiones,
        suavizado de forma exponencial y normalizado en una escala de -100 a +100.
      </p>
      <p>
        Zonas: <strong>zona alta</strong> (por encima de +40), <strong>zona intermedia</strong>{' '}
        (entre -40 y +40) y <strong>zona baja</strong> (por debajo de -40).
      </p>

      <h2>Definición de señales</h2>
      <p>
        Se registra una <strong>señal de compra</strong> cuando el indicador gira de bajista a
        alcista estando por debajo de +40. Se registra una <strong>señal de venta</strong> cuando
        el indicador gira de alcista a bajista. La ejecución se realiza al cierre de la sesión
        anterior a la confirmación.
      </p>

      <h2>Estadística histórica</h2>
      <p>
        El porcentaje de acierto se calcula sobre los ciclos cerrados del registro histórico de
        señales: una compra se cierra con la siguiente venta registrada; una venta se cierra con la
        siguiente compra registrada. Si la última señal no ha sido seguida por una señal contraria,
        se evalúa hasta el precio actual.
      </p>
      <p>
        Si el tamaño de muestra es inferior a 10 observaciones, se añade el aviso{' '}
        <em>"Muestra limitada. Interpretar con cautela."</em>
      </p>

      <h2>Limitaciones estadísticas</h2>
      <ul>
        <li>El histórico analizado abarca 1 año de sesiones diarias.</li>
        <li>Los resultados describen comportamiento pasado y no predicen el futuro.</li>
        <li>Las señales no representan operaciones reales.</li>
      </ul>

      <h2>Glosario</h2>
      <ul>
        <li><strong>Zona alta / intermedia / baja:</strong> rangos del indicador propietario.</li>
        <li><strong>Percentil:</strong> posición del valor actual dentro del rango de 60 sesiones.</li>
        <li><strong>Ciclo:</strong> intervalo entre una señal y la siguiente de tipo contrario.</li>
      </ul>

      <p className="v3-aviso-mute" style={{ marginTop: '40px' }}>
        La ficha metodológica describe cómo se generan los análisis. No constituye asesoramiento
        financiero ni recomendación de inversión.
      </p>
    </main>
  );
}
