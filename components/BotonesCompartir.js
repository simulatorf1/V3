'use client';

import { useState } from 'react';

export default function BotonesCompartir({ empresa, analisis, url }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoTuit, setTextoTuit] = useState('');

  function generarTextoTuit() {
    if (!empresa || !analisis) return '';

    const ticker = empresa.ticker;
    const nombre = empresa.nombre;
    const zona = analisis.zona;
    const precio = analisis.precioActual?.toFixed(2) || '—';

    const smis = (analisis.smisUltimos60 || []).filter(
      (v) => v !== null && v !== undefined
    );
    const ordenados = [...smis].sort((a, b) => a - b);
    const smi = analisis.smiActual;
    const menores = ordenados.filter((v) => v < smi).length;
    const percentil =
      ordenados.length > 0 ? Math.round((menores / ordenados.length) * 100) : 0;

    // Estadística de ciclos
    const senales = analisis.senales || [];
    const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
    const ciclos = lista.map((s, i) => {
      const siguiente = lista[i + 1];
      const precioCierre = siguiente ? siguiente.precio : analisis.precioActual;
      const variacion = precioCierre
        ? ((precioCierre - s.precio) / s.precio) * 100
        : 0;
      let acierto = null;
      if (variacion !== 0) {
        if (s.tipo === 'compra') acierto = variacion > 0;
        else if (s.tipo === 'venta') acierto = variacion < 0;
      }
      return { tipo: s.tipo, acierto };
    });

    const compras = ciclos.filter((c) => c.tipo === 'compra');
    const ventas = ciclos.filter((c) => c.tipo === 'venta');

    function statsCiclo(listaCiclos) {
      let aciertos = 0;
      let total = 0;
      for (const c of listaCiclos) {
        if (c.acierto === null) continue;
        total++;
        if (c.acierto) aciertos++;
      }
      return {
        total: listaCiclos.length,
        porcentaje: total > 0 ? (aciertos / total) * 100 : 0
      };
    }

    const statsCompras = statsCiclo(compras);
    const statsVentas = statsCiclo(ventas);

    const ultima = lista.length > 0 ? lista[lista.length - 1] : null;
    const ultimaTipo = ultima ? ultima.tipo : null;
    const posicionAbierta = analisis.posicionAbierta;

    // Texto humano y descriptivo
    let texto = `Nuevo análisis de ${nombre} (${ticker}). `;
    texto += `Precio ${precio}. `;
    texto += `Indicador en zona ${zona}, percentil ${percentil}.`;

    // Estadística del último tipo de movimiento
    if (ultimaTipo === 'compra' && statsCompras.total > 0) {
      texto += ` Acierto histórico de movimientos de compra: ${statsCompras.porcentaje.toFixed(0)}% (${statsCompras.total} ciclos).`;
    } else if (ultimaTipo === 'venta' && statsVentas.total > 0) {
      texto += ` Acierto histórico de movimientos de venta: ${statsVentas.porcentaje.toFixed(0)}% (${statsVentas.total} ciclos).`;
    }

    // Posición abierta
    if (posicionAbierta && ultimaTipo) {
      texto += ` Posición abierta según reglas del registro: ${ultimaTipo}.`;
    }

    // Enlace
    const enlace = ` Más en: ${url}`;
    texto += enlace;

    // Recorte a 280
    if (texto.length > 280) {
      const espacio = 280 - enlace.length - 3;
      texto = texto.slice(0, espacio) + '...' + enlace;
    }

    return texto;
  }

  function abrirModal() {
    setTextoTuit(generarTextoTuit());
    setModalAbierto(true);
  }

  function publicarEnX() {
    const texto = encodeURIComponent(textoTuit);
    window.open(`https://twitter.com/intent/tweet?text=${texto}`, '_blank');
  }

  const urlCodificada = encodeURIComponent(url);
  const textoWhatsApp = encodeURIComponent(`${empresa?.nombre} (${empresa?.ticker}) — ${url}`);

  const estiloBoton = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: 'var(--v3-radius-sm)',
    border: '1px solid var(--v3-border-strong)',
    background: '#fff',
    color: 'var(--v3-text)',
    cursor: 'pointer',
    textDecoration: 'none'
  };

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Compartir</h2>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        <a
          href={`https://api.whatsapp.com/send?text=${textoWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={estiloBoton}
        >
          WhatsApp
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${urlCodificada}`}
          target="_blank"
          rel="noopener noreferrer"
          style={estiloBoton}
        >
          Facebook
        </a>

        <button
          onClick={abrirModal}
          style={{
            ...estiloBoton,
            background: '#000',
            borderColor: '#000',
            color: '#fff'
          }}
        >
          Publicar en X
        </button>
      </div>

      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="v3-card"
            style={{
              maxWidth: '540px',
              width: '100%',
              background: '#fff',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Publicar en X</h3>
            <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
              Revisa el texto y pulsa "Publicar en X". El enlace mostrará una tarjeta con la
              información de la empresa.
            </p>

            <textarea
              value={textoTuit}
              onChange={(e) => setTextoTuit(e.target.value)}
              rows={7}
              maxLength={280}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid var(--v3-border-strong)',
                borderRadius: 'var(--v3-radius-sm)',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />

            <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '4px' }}>
              {textoTuit.length} / 280 caracteres
            </p>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={() => setModalAbierto(false)}
                className="v3-btn v3-btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={publicarEnX} className="v3-btn">
                Publicar en X
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
