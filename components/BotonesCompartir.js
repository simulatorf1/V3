'use client';

import { useState } from 'react';

const VENTANA = 10;
const RANGO_VALOR = 30;
const MAX_TUIT = 280;

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta del rango';
  if (zona === 'baja') return 'parte baja del rango';
  return 'parte intermedia del rango';
}

function calcularPendiente(smis, idx) {
  if (idx < 1) return null;
  const actual = smis[idx];
  const anterior = smis[idx - 1];
  if (actual === null || actual === undefined || anterior === null || anterior === undefined) {
    return null;
  }
  return actual - anterior;
}

function calcularProyeccion(velas, smis) {
  if (!velas || !smis || velas.length < 20 || smis.length < 20) return null;

  const idxActual = smis.length - 1;
  const smiActual = smis[idxActual];
  if (smiActual === null || smiActual === undefined) return null;

  const pendienteActual = calcularPendiente(smis, idxActual);
  const casos = [];

  for (let i = idxActual - 1; i >= 0; i--) {
    if (i + VENTANA >= velas.length) continue;

    const v = smis[i];
    if (v === null || v === undefined) continue;
    if (Math.abs(v - smiActual) > RANGO_VALOR) continue;

    const pend = calcularPendiente(smis, i);
    if (pend === null) continue;

    if (pendienteActual !== null) {
      if (pendienteActual >= 0 && pend < 0) continue;
      if (pendienteActual < 0 && pend >= 0) continue;
    }

    const precioInicio = velas[i].close;
    const precioFin = velas[i + VENTANA].close;
    const variacion = ((precioFin - precioInicio) / precioInicio) * 100;

    casos.push({ fecha: velas[i].date, variacion });
  }

  if (casos.length === 0) return null;

  const subidas = casos.filter((c) => c.variacion > 0);
  const bajadas = casos.filter((c) => c.variacion < 0);

  const mediaSubidas =
    subidas.length > 0
      ? subidas.reduce((a, c) => a + c.variacion, 0) / subidas.length
      : null;
  const mediaBajadas =
    bajadas.length > 0
      ? bajadas.reduce((a, c) => a + c.variacion, 0) / bajadas.length
      : null;

  return {
    total: casos.length,
    subidas: subidas.length,
    bajadas: bajadas.length,
    mediaSubidas,
    mediaBajadas
  };
}

/**
 * Recorta el texto a MAX_TUIT caracteres sin romper el enlace final.
 * Si hay que recortar, quita caracteres del cuerpo (no del enlace).
 */
function recortarTuit(cuerpo, enlace) {
  const sufijo = `\n${enlace}`;
  const espacioCuerpo = MAX_TUIT - sufijo.length;

  if (cuerpo.length + sufijo.length <= MAX_TUIT) {
    return cuerpo + sufijo;
  }

  // Recortar cuerpo y añadir "…" antes del enlace
  const recortado = cuerpo.slice(0, espacioCuerpo - 1).trimEnd() + '…';
  return recortado + sufijo;
}

export default function BotonesCompartir({ empresa, analisis, url }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoTuit, setTextoTuit] = useState('');
  const [copiado, setCopiado] = useState(false);

  function generarTextoTuit() {
    if (!empresa || !analisis) return '';

    const nombre = empresa.nombre;
    const precio = analisis.precioActual?.toFixed(2) || '—';
    const situacion = situacionDesdeZona(analisis.zona);
    const velas = analisis.velasUltimas60 || [];
    const smis = analisis.smisUltimos60 || [];

    let variacion60 = null;
    if (velas.length >= 2) {
      const primero = velas[0]?.close;
      const ultimo = velas[velas.length - 1]?.close;
      if (primero) {
        variacion60 = ((ultimo - primero) / primero) * 100;
      }
    }

    const proyeccion = calcularProyeccion(velas, smis);

    const hashtagNombre = `#${nombre.replace(/\s+/g, '')}`;
    const tickerLimpio = empresa.ticker.split('.')[0];
    const hashtagTicker = `#${tickerLimpio}`;

    // ─── Construir cuerpo (sin enlace) ───
    let cuerpo = `${hashtagNombre} ${hashtagTicker}\n`;
    cuerpo += `Precio: ${precio} €`;
    if (variacion60 !== null) {
      const signo = variacion60 >= 0 ? '+' : '';
      cuerpo += ` · 60 sesiones: ${signo}${variacion60.toFixed(1)}%`;
    }
    cuerpo += `\n${situacion}\n\n`;

    if (proyeccion) {
      cuerpo += `Últimas ${proyeccion.total} veces en posición similar:\n`;
      if (proyeccion.subidas > 0) {
        const signo = proyeccion.mediaSubidas >= 0 ? '+' : '';
        cuerpo += `• ${proyeccion.subidas} ${proyeccion.subidas === 1 ? 'vez subió' : 'veces subió'} (media ${signo}${proyeccion.mediaSubidas.toFixed(1)}%)\n`;
      }
      if (proyeccion.bajadas > 0) {
        const signo = proyeccion.mediaBajadas >= 0 ? '+' : '';
        cuerpo += `• ${proyeccion.bajadas} ${proyeccion.bajadas === 1 ? 'vez bajó' : 'veces bajó'} (media ${signo}${proyeccion.mediaBajadas.toFixed(1)}%)\n`;
      }
      cuerpo += `\n`;
    } else {
      cuerpo += `Sin coincidencias históricas suficientes para esta posición.\n\n`;
    }

    cuerpo += `¿Tú qué crees que hará? 👇`;

    // ─── Recortar a 280 respetando el enlace ───
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
