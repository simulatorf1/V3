'use client';

import { useState } from 'react';

function calcularAciertos(senales, velas) {
  const lista = [...senales].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const velasOrdenadas = [...velas].sort((a, b) => (a.date < b.date ? -1 : 1));

  const ciclos = lista.map((s, i) => {
    const siguiente = lista[i + 1];
    const fechaInicio = s.fecha;
    const fechaFin = siguiente ? siguiente.fecha : null;

    let extremo = null;
    for (const v of velasOrdenadas) {
      if (v.date < fechaInicio) continue;
      if (fechaFin && v.date >= fechaFin) break;
      if (s.tipo === 'compra') {
        if (extremo === null || v.high > extremo) extremo = v.high;
      } else {
        if (extremo === null || v.low < extremo) extremo = v.low;
      }
    }

    let variacion = 0;
    let acierto = null;
    if (extremo !== null) {
      if (s.tipo === 'compra') {
        variacion = ((extremo - s.precio) / s.precio) * 100;
        acierto = variacion > 0;
      } else {
        variacion = ((s.precio - extremo) / s.precio) * 100;
        acierto = variacion > 0;
      }
    }

    return { tipo: s.tipo, acierto };
  });

  function stats(tipo) {
    const filtrados = ciclos.filter((c) => c.tipo === tipo);
    let aciertos = 0;
    let total = 0;
    for (const c of filtrados) {
      if (c.acierto === null) continue;
      total++;
      if (c.acierto) aciertos++;
    }
    return {
      muestra: filtrados.length,
      porcentaje: total > 0 ? (aciertos / total) * 100 : 0
    };
  }

  return { compras: stats('compra'), ventas: stats('venta') };
}

export default function BotonesCompartir({ empresa, analisis, url, futuro }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoTuit, setTextoTuit] = useState('');

  function generarTextoTuit() {
    if (!empresa || !analisis) return '';

    const ticker = empresa.ticker;
    const nombre = empresa.nombre;
    const zona = analisis.zona;
    const precio = analisis.precioActual?.toFixed(2) || '—';

    const senales = analisis.senales || [];
    const velas = analisis.velasUltimos60 || [];
    const ultimaSenal = senales.length > 0 ? senales[senales.length - 1] : null;

    const stats = calcularAciertos(senales, velas);

    let texto = `Nuevo análisis de ${nombre} (${ticker}). `;
    texto += `Precio ${precio}. `;

    if (zona === 'alta') texto += `Indicador en zona alta. `;
    else if (zona === 'baja') texto += `Indicador en zona baja. `;
    else texto += `Indicador en zona intermedia. `;

    if (futuro && futuro.ultimoCaso) {
      const tipoGiro = futuro.ultimoCaso.direccionGiro === 'subiendo' ? 'compra' : 'venta';
      texto += `Estadísticamente, ${futuro.ultimoCaso.sesiones} ${
        futuro.ultimoCaso.sesiones === 1 ? 'sesión' : 'sesiones'
      } para dar ${tipoGiro} de nuevo. `;
    }

    if (ultimaSenal) {
      texto += `Último movimiento registrado: ${ultimaSenal.tipo}. `;
    }

    if (stats.compras.muestra > 0) {
      texto += `Acierto histórico de compras: ${stats.compras.porcentaje.toFixed(0)}%. `;
    }
    if (stats.ventas.muestra > 0) {
      texto += `Acierto histórico de ventas: ${stats.ventas.porcentaje.toFixed(0)}%. `;
    }

    const enlace = `Más en: ${url}`;
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
