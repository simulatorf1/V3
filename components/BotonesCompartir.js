'use client';

import { useState } from 'react';

function situacionDesdeZona(zona) {
  if (zona === 'alta') return 'parte alta del rango';
  if (zona === 'baja') return 'parte baja del rango';
  return 'parte intermedia del rango';
}

export default function BotonesCompartir({ empresa, analisis, url }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState('divulgativo'); // 'divulgativo' | 'tecnico'
  const [textoTuit, setTextoTuit] = useState('');
  const [copiado, setCopiado] = useState(false);

  // ---------- CÁLCULOS COMUNES ----------
  function calcularDatos() {
    const velas = analisis?.velasUltimas60 || [];
    const smis = analisis?.smisUltimos60 || [];

    const precio = analisis?.precioActual ?? null;

    let variacion5 = null;
    if (velas.length >= 6 && velas[velas.length - 6]?.close) {
      const p5 = velas[velas.length - 6].close;
      variacion5 = ((precio - p5) / p5) * 100;
    }

    let variacion60 = null;
    if (velas.length >= 2 && velas[0]?.close) {
      variacion60 = ((velas[velas.length - 1].close - velas[0].close) / velas[0].close) * 100;
    }

    const maximos = velas.map((v) => v.high).filter((v) => v !== undefined);
    const minimos = velas.map((v) => v.low).filter((v) => v !== undefined);
    const maximo60 = maximos.length ? Math.max(...maximos) : null;
    const minimo60 = minimos.length ? Math.min(...minimos) : null;

    const validos = smis.filter((v) => v !== null && v !== undefined);
    let percentil = null;
    if (validos.length && analisis?.smiActual !== undefined) {
      const menores = validos.filter((v) => v < analisis.smiActual).length;
      percentil = Math.round((menores / validos.length) * 100);
    }

    let volatilidad = null;
    if (velas.length >= 2) {
      const retornos = [];
      for (let i = 1; i < velas.length; i++) {
        if (velas[i - 1]?.close) {
          retornos.push((velas[i].close - velas[i - 1].close) / velas[i - 1].close);
        }
      }
      if (retornos.length) {
        const media = retornos.reduce((a, b) => a + b, 0) / retornos.length;
        const varianza =
          retornos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / retornos.length;
        volatilidad = Math.sqrt(varianza) * 100;
      }
    }

    const variacionSector60 =
      analisis?.sectorInfo && analisis.sectorInfo.variacionSector60 !== null
        ? analisis.sectorInfo.variacionSector60
        : null;

    const situacion = analisis?.zona ? situacionDesdeZona(analisis.zona) : null;

    return {
      precio,
      variacion5,
      variacion60,
      maximo60,
      minimo60,
      percentil,
      volatilidad,
      variacionSector60,
      situacion,
      smiActual: analisis?.smiActual ?? null,
      sector: analisis?.sectorInfo?.sector || empresa?.sector || null,
      etf: analisis?.sectorInfo?.etf || null
    };
  }

  function formatearPct(v, decimales = 1) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return `${v >= 0 ? '+' : ''}${v.toFixed(decimales)}%`;
  }

  function formatearNum(v, decimales = 2) {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    return v.toFixed(decimales);
  }

  // ---------- TEXTO DIVULGATIVO ----------
  function generarTextoDivulgativo(d) {
    const nombre = empresa?.nombre || '';
    const ticker = empresa?.ticker || '';
    const enlace = `Más en: ${url}`;

    const variacionTexto =
      d.variacion60 === null
        ? ''
        : d.variacion60 > 0.05
        ? `ha subido un ${d.variacion60.toFixed(1)}%`
        : d.variacion60 < -0.05
        ? `ha bajado un ${Math.abs(d.variacion60).toFixed(1)}%`
        : 'se ha mantenido prácticamente estable';

    let comparacionTexto = '';
    if (d.variacion60 !== null && d.variacionSector60 !== null) {
      const diff = d.variacion60 - d.variacionSector60;
      if (Math.abs(diff) < 2) comparacionTexto = 'Evolución similar a su sector.';
      else if (diff > 0) comparacionTexto = 'Evolución algo mejor que su sector.';
      else comparacionTexto = 'Evolución algo peor que su sector.';
    }

    let texto = `${nombre} (${ticker}) · Precio ${formatearNum(d.precio)} €. `;
    if (variacionTexto && d.situacion) {
      texto += `En las últimas 60 sesiones, el precio ${variacionTexto} y se sitúa en la ${d.situacion}. `;
    } else if (d.situacion) {
      texto += `El precio se sitúa en la ${d.situacion}. `;
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

  // ---------- TEXTO TÉCNICO ----------
  function generarTextoTecnico(d) {
    const nombre = empresa?.nombre || '';
    const ticker = empresa?.ticker || '';
    const enlace = `Datos: ${url}`;

    const lineas = [];

    lineas.push(`${nombre} (${ticker}) · Resumen técnico`);

    if (d.sector) {
      lineas.push(`Sector: ${d.sector}${d.etf ? ` (ref. ${d.etf})` : ''}`);
    }

    lineas.push(
      `Precio: ${formatearNum(d.precio)} € · 5 ses.: ${formatearPct(d.variacion5, 2)} · 60 ses.: ${formatearPct(d.variacion60, 2)}`
    );

    if (d.maximo60 !== null && d.minimo60 !== null) {
      lineas.push(`Rango 60 ses.: ${formatearNum(d.minimo60)} € – ${formatearNum(d.maximo60)} €`);
    }

    if (d.situacion) {
      lineas.push(
        `Indicador: ${formatearNum(d.smiActual, 2)} (${d.situacion}${
          d.percentil !== null ? ` · percentil ${d.percentil}` : ''
        })`
      );
    }

    if (d.volatilidad !== null) {
      lineas.push(`Volatilidad diaria media 60 ses.: ${d.volatilidad.toFixed(2)}%`);
    }

    if (d.variacionSector60 !== null) {
      lineas.push(`Sector 60 ses.: ${formatearPct(d.variacionSector60, 2)}`);
    }

    lineas.push('Datos históricos descriptivos. No es recomendación de inversión.');

    let texto = lineas.join('\n');

    if (texto.length + enlace.length + 2 > 280) {
      const disponibles = 280 - enlace.length - 5;
      let acumulado = '';
      for (const l of lineas) {
        if ((acumulado + l + '\n').length > disponibles) break;
        acumulado += l + '\n';
      }
      texto = acumulado.trimEnd() + ' …\n' + enlace;
    } else {
      texto += `\n${enlace}`;
    }

    if (texto.length > 280) texto = texto.slice(0, 277) + '…';

    return texto;
  }

  // ---------- MODAL ----------
  function abrirModal(nuevoModo) {
    const d = calcularDatos();
    const texto =
      nuevoModo === 'tecnico' ? generarTextoTecnico(d) : generarTextoDivulgativo(d);
    setModo(nuevoModo);
    setTextoTuit(texto);
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
        // Fallback para navegadores antiguos
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
      // Si falla el portapapeles, seleccionamos el texto para que el usuario lo copie a mano
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

  const estiloBotonX = {
    ...estiloBoton,
    background: '#000',
    borderColor: '#000',
    color: '#fff'
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

        <button onClick={() => abrirModal('divulgativo')} style={estiloBotonX}>
          Publicar en X (resumen)
        </button>

        <button onClick={() => abrirModal('tecnico')} style={estiloBotonX}>
          Publicar en X (técnico)
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
              maxWidth: '560px',
              width: '100%',
              background: '#fff',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              Publicar en X · {modo === 'tecnico' ? 'resumen técnico' : 'resumen divulgativo'}
            </h3>
            <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
              Revisa el texto antes de publicarlo o cópialo para usarlo donde quieras.
            </p>

            <textarea
              value={textoTuit}
              onChange={(e) => setTextoTuit(e.target.value)}
              rows={modo === 'tecnico' ? 10 : 7}
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
