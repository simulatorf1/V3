'use client';

import { useState } from 'react';

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta del rango';
  if (zona === 'baja') return 'parte baja del rango';
  return 'parte intermedia del rango';
}

export default function BotonesCompartir({ empresa, analisis, url }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoTuit, setTextoTuit] = useState('');

  function generarTextoTuit() {
    if (!empresa || !analisis) return '';

    const ticker = empresa.ticker;
    const nombre = empresa.nombre;
    const precio = analisis.precioActual?.toFixed(2) || '—';
    const situacion = situacionDesdeZona(analisis.zona);

    // Variación en 60 sesiones a partir de las velas
    const velas = analisis.velasUltimas60 || [];
    let variacion60 = null;
    if (velas.length >= 2) {
      const primero = velas[0]?.close;
      const ultimo = velas[velas.length - 1]?.close;
      if (primero) {
        variacion60 = ((ultimo - primero) / primero) * 100;
      }
    }

    const variacionTexto =
      variacion60 === null
        ? ''
        : variacion60 > 0.05
        ? `ha subido un ${variacion60.toFixed(1)}%`
        : variacion60 < -0.05
        ? `ha bajado un ${Math.abs(variacion60).toFixed(1)}%`
        : 'se ha mantenido prácticamente estable';

    const variacionSector60 =
      analisis.sectorInfo && analisis.sectorInfo.variacionSector60 !== null
        ? analisis.sectorInfo.variacionSector60
        : null;

    let comparacionTexto = '';
    if (variacion60 !== null && variacionSector60 !== null) {
      const diff = variacion60 - variacionSector60;
      if (Math.abs(diff) < 2) comparacionTexto = 'Evolución similar a su sector.';
      else if (diff > 0) comparacionTexto = 'Evolución algo mejor que su sector.';
      else comparacionTexto = 'Evolución algo peor que su sector.';
    }

    const enlace = `Más en: ${url}`;

    let texto = `${nombre} (${ticker}) · Precio ${precio} €. `;
    if (variacionTexto) {
      texto += `En las últimas 60 sesiones, el precio ${variacionTexto} y se sitúa en la ${situacion}. `;
    } else {
      texto += `El precio se sitúa en la ${situacion}. `;
    }
    if (comparacionTexto) texto += `${comparacionTexto} `;
    texto += `Información histórica, no predictiva ni recomendación de inversión. `;
    texto += enlace;

    if (texto.length > 280) {
      const espacio = 280 - enlace.length - 4;
      texto = texto.slice(0, espacio) + '... ' + enlace;
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
  const textoWhatsApp = encodeURIComponent(
    `${empresa?.nombre} (${empresa?.ticker}) — ficha estadística descriptiva — ${url}`
  );

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
