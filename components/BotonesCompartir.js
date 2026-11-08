'use client';

import { useState } from 'react';

const MAX_TUIT = 280;

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta del rango';
  if (zona === 'baja') return 'parte baja del rango';
  return 'parte intermedia del rango';
}

function bloqueDireccionCorto(proyeccion, horizonte) {
  if (!proyeccion) return null;
  const { total, subidas, bajadas } = proyeccion;
  if (total === 0) return null;

  const pctSubidas = Math.round((subidas / total) * 100);
  const pctBajadas = 100 - pctSubidas;

  if (subidas > bajadas) {
    return `${horizonte}: subió ${subidas}/${total} (${pctSubidas}% subidas)`;
  }
  if (bajadas > subidas) {
    return `${horizonte}: bajó ${bajadas}/${total} (${pctBajadas}% bajadas)`;
  }
  return `${horizonte}: ${subidas} subidas / ${bajadas} bajadas`;
}

function cierreCorto(proyeccionDiaria, proyeccionSemanal) {
  const partes = [];
  if (proyeccionDiaria) {
    const { total, subidas, bajadas } = proyeccionDiaria;
    if (total > 0) {
      if (bajadas > subidas) partes.push('A corto plazo, ha bajado más veces.');
      else if (subidas > bajadas) partes.push('A corto plazo, ha subido más veces.');
      else partes.push('A corto plazo, ha subido y bajado por igual.');
    }
  }
  if (proyeccionSemanal) {
    const { total, subidas, bajadas } = proyeccionSemanal;
    if (total > 0) {
      if (bajadas > subidas) partes.push('A largo plazo, ha bajado más veces.');
      else if (subidas > bajadas) partes.push('A largo plazo, ha subido más veces.');
      else partes.push('A largo plazo, ha subido y bajado por igual.');
    }
  }
  return partes.join(' ');
}

function recortarTuit(cuerpo, enlace) {
  const sufijo = `\n${enlace}`;
  const espacioCuerpo = MAX_TUIT - sufijo.length;

  if (cuerpo.length + sufijo.length <= MAX_TUIT) {
    return cuerpo + sufijo;
  }

  const recortado = cuerpo.slice(0, espacioCuerpo - 1).trimEnd() + '…';
  return recortado + sufijo;
}

export default function BotonesCompartir({
  empresa,
  analisis,
  url,
  proyeccionDiaria,
  proyeccionSemanal
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoTuit, setTextoTuit] = useState('');
  const [copiado, setCopiado] = useState(false);

  function generarTextoTuit() {
    if (!empresa || !analisis) return '';

    const nombre = empresa.nombre;
    const precio = analisis.precioActual?.toFixed(2) || '—';
    const situacion = situacionDesdeZona(analisis.zona);

    const bDiario = bloqueDireccionCorto(proyeccionDiaria, '10 días siguientes');
    const bSemanal = bloqueDireccionCorto(proyeccionSemanal, '10 semanas siguientes');

    const hashtagNombre = `#${nombre.replace(/\s+/g, '')}`;
    const tickerLimpio = empresa.ticker.split('.')[0];
    const hashtagTicker = `#${tickerLimpio}`;

    let cuerpo = `${hashtagNombre} ${hashtagTicker}\n`;
    cuerpo += `Precio: ${precio} € · ${situacion}\n\n`;

    if (bDiario || bSemanal) {
      cuerpo += `Según nuestro indicador Equaty, las últimas veces que estuvo en una posición similar:\n`;
      if (bDiario) cuerpo += `• ${bDiario}\n`;
      if (bSemanal) cuerpo += `• ${bSemanal}\n`;
      cuerpo += `\n`;
      const cierre = cierreCorto(proyeccionDiaria, proyeccionSemanal);
      if (cierre) cuerpo += `${cierre}\n\n`;
    } else {
      cuerpo += `Sin suficientes casos históricos similares.\n\n`;
    }

    cuerpo += `¿Tú qué crees que hará? 👇`;

    return recortarTuit(cuerpo, url);
  }

  function abrirModal() {
    setTextoTuit(generarTextoTuit());
    setCopiado(false);
    setModalAbierto(true);
  }

  function publicarEnX() {
    const texto = encodeURIComponent(textoTuit);
    window.open(`https://twitter.com/intent/tweet?text=${texto}`, '_blank');
  }

  async function copiarTexto() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textoTuit);
      } else {
        const ta = document.createElement('textarea');
        ta.value = textoTuit;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      const ta = document.querySelector('textarea');
      if (ta) {
        ta.focus();
        ta.select();
      }
    }
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
              Revisa el texto antes de publicarlo o cópialo para usarlo donde quieras.
            </p>

            <textarea
              value={textoTuit}
              onChange={(e) => setTextoTuit(e.target.value)}
              rows={10}
              maxLength={MAX_TUIT}
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

            <p
              style={{
                color: textoTuit.length > MAX_TUIT ? '#dc2626' : 'var(--v3-text-mute)',
                fontSize: '12px',
                marginTop: '4px',
                fontWeight: textoTuit.length > MAX_TUIT ? 600 : 400
              }}
            >
              {textoTuit.length} / {MAX_TUIT} caracteres
              {textoTuit.length > MAX_TUIT && ' — te has pasado'}
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
                onClick={copiarTexto}
                className="v3-btn v3-btn-secondary"
                style={{ minWidth: '130px' }}
              >
                {copiado ? '✓ Copiado' : 'Copiar texto'}
              </button>
              <button
                onClick={() => setModalAbierto(false)}
                className="v3-btn v3-btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={publicarEnX}
                className="v3-btn"
                disabled={textoTuit.length > MAX_TUIT}
                style={
                  textoTuit.length > MAX_TUIT
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : undefined
                }
              >
                Publicar en X
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
