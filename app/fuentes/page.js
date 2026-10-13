export const metadata = {
  title: 'Fuentes — V3',
  description: 'Fuentes de datos utilizadas por V3.'
};

export default function Fuentes() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Fuentes</h1>

      <p>Esta web utiliza exclusivamente fuentes de datos públicas y gratuitas.</p>

      <h2>Precios históricos</h2>
      <ul>
        <li>Yahoo Finance — endpoint público <code>query1.finance.yahoo.com</code>.</li>
        <li>Datos OHLCV (apertura, máximo, mínimo, cierre y volumen) de sesiones diarias.</li>
      </ul>

      <h2>Noticias</h2>
      <ul>
        <li>Yahoo Finance News — titulares con enlace al medio original.</li>
        <li>Los titulares se muestran literalmente y nunca se interpretan.</li>
      </ul>

      <h2>Referencias sectoriales</h2>
      <ul>
        <li>ETFs cotizados en EE. UU. como proxy de cada sector (XLK, XLE, XLF, etc.).</li>
      </ul>

      <p style={{ color: '#666', fontSize: '13px', marginTop: '40px' }}>
        Todas las fuentes se citan por transparencia. No existe relación comercial con ellas.
      </p>
    </main>
  );
}
