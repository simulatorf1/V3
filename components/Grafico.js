'use client';

import { useEffect, useRef, useState } from 'react';

const VELAS_ATRAS = 30;
const VENTANA = 10;
const RANGO_VALOR = 30;
const SEPARACION_MINIMA = 10;

function calcularPendiente(smis, idx) {
  if (idx < 1) return null;
  const actual = smis[idx];
  const anterior = smis[idx - 1];
  if (actual === null || actual === undefined || anterior === null || anterior === undefined) {
    return null;
  }
  return actual - anterior;
}

function buscarCoincidencias(velas, smis, smiActual) {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) return [];
  if (smiActual === null || smiActual === undefined) return [];

  const idxActual = smis.length - 1;
  const pendienteActual = calcularPendiente(smis, idxActual);

  const coincidencias = [];

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

    coincidencias.push({
      indexFecha: i,
      fecha: velas[i].date,
      smi: v,
      distancia: Math.abs(v - smiActual)
    });
  }

  return coincidencias.sort((a, b) => a.distancia - b.distancia);
}

function sumarDiasHabiles(fechaStr, dias) {
  const f = new Date(fechaStr + 'T00:00:00');
  let contados = 0;
  while (contados < dias) {
    f.setDate(f.getDate() + 1);
    const diaSemana = f.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      contados++;
    }
  }
  return f.toISOString().slice(0, 10);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr + 'T00:00:00');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()}-${meses[d.getMonth()]}`;
  } catch (e) {
    return '';
  }
}

export default function Grafico({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const chartRef = useRef(null);
  const [coincidencias, setCoincidencias] = useState([]);
  const [posicion, setPosicion] = useState(-1);
  const [infoSeleccion, setInfoSeleccion] = useState(null);

  const smiFinal =
    smiActual !== null && smiActual !== undefined
      ? smiActual
      : smis && smis.length > 0
      ? smis[smis.length - 1]
      : null;

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    const encontradas = buscarCoincidencias(velas, smis, smiFinal);
    setCoincidencias(encontradas);
    setPosicion(-1);
  }, [velas, smis, smiFinal]);

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    if (!contenedorRef.current) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
    }

    let chart;
    let cleanup = () => {};
    let cancelado = false;

    async function init() {
      try {
        const { createChart, LineStyle } = await import('lightweight-charts');
        if (cancelado) return;
        if (!contenedorRef.current) return;

        chart = createChart(contenedorRef.current, {
          width: contenedorRef.current.clientWidth,
          height: 420,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#666',
            fontSize: 10,
            fontFamily: 'sans-serif'
          },
          grid: {
            vertLines: { color: '#f5f5f5' },
            horzLines: { color: '#f5f5f5' }
          },
          timeScale: {
            borderColor: '#e5e7eb',
            rightOffset: 0,
            barSpacing: 4,
            minBarSpacing: 1
          },
          rightPriceScale: {
            borderColor: '#e5e7eb',
            scaleMargins: { top: 0, bottom: 0 }
          },
          leftPriceScale: {
            borderColor: '#e5e7eb',
            visible: true,
            scaleMargins: { top: 0, bottom: 0 }
          }
        });

        chartRef.current = chart;

        const ultimaVela = velas[velas.length - 1];
        const cierreActual = ultimaVela.close;

        const velasSeries = chart.addCandlestickSeries({
          upColor: '#2563eb',
          downColor: '#9ca3af',
          borderUpColor: '#2563eb',
          borderDownColor: '#9ca3af',
          wickUpColor: '#2563eb',
          wickDownColor: '#9ca3af',
          priceScaleId: 'right'
        });
        velasSeries.setData(
          velas.map((v) => ({
            time: v.date,
            open: v.open,
            high: v.high,
            low: v.low,
            close: v.close
          }))
        );

        const lineaMediaData = velas.map((v) => ({
          time: v.date,
          value: (v.high + v.low) / 2
        }));

        const lineaMedia = chart.addLineSeries({
          color: '#ea580c',
          lineWidth: 1.5,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        lineaMedia.setData(lineaMediaData);

        // Sombreado del indicador en zonas extremas
        const smiData = [];
        for (let i = 0; i < smis.length; i++) {
          if (smis[i] === null || smis[i] === undefined) continue;
          if (!velas[i]) continue;
          smiData.push({ time: velas[i].date, value: smis[i] });
        }

        const zonaSuperior = chart.addBaselineSeries({
          baseValue: { type: 'price', price: 40 },
          topFillColor1: 'rgba(37, 99, 235, 0.35)',
          topFillColor2: 'rgba(37, 99, 235, 0.08)',
          bottomFillColor1: 'rgba(37, 99, 235, 0)',
          bottomFillColor2: 'rgba(37, 99, 235, 0)',
          topLineColor: 'rgba(37, 99, 235, 0.3)',
          bottomLineColor: 'rgba(37, 99, 235, 0)',
          lineWidth: 1,
          priceScaleId: 'left',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        zonaSuperior.setData(smiData);

        const zonaInferior = chart.addBaselineSeries({
          baseValue: { type: 'price', price: -40 },
          topFillColor1: 'rgba(156, 163, 175, 0)',
          topFillColor2: 'rgba(156, 163, 175, 0)',
          bottomFillColor1: 'rgba(156, 163, 175, 0.35)',
          bottomFillColor2: 'rgba(156, 163, 175, 0.08)',
          topLineColor: 'rgba(156, 163, 175, 0)',
          bottomLineColor: 'rgba(156, 163, 175, 0.3)',
          lineWidth: 1,
          priceScaleId: 'left',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        zonaInferior.setData(smiData);

        const smiLine = chart.addLineSeries({
          color: '#7b1fa2',
          lineWidth: 2,
          title: 'Indicador',
          priceScaleId: 'left'
        });
        smiLine.setData(smiData);

        smiLine.createPriceLine({
          price: 40,
          color: '#2563eb',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'parte alta',
          priceScaleId: 'left'
        });
        smiLine.createPriceLine({
          price: -40,
          color: '#9ca3af',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'parte baja',
          priceScaleId: 'left'
        });
        smiLine.createPriceLine({
          price: 0,
          color: '#aaa',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false,
          priceScaleId: 'left'
        });

        chart.priceScale('left').applyOptions({
          autoScale: false,
          scaleMargins: { top: 0, bottom: 0 }
        });
        smiLine.applyOptions({
          autoscaleInfoProvider: () => ({
            priceRange: { minValue: -100, maxValue: 100 }
          })
        });

        // Series de la zona seleccionada (se crean y destruyen al mover el slider)
        chart._zonaSeries = { areaSup: null, areaInf: null, areaFutura: null, lineaFutura: null };

        chart._limpiarZona = () => {
          if (chart._zonaSeries.areaSup) {
            try { chart.removeSeries(chart._zonaSeries.areaSup); } catch (e) {}
          }
          if (chart._zonaSeries.areaInf) {
            try { chart.removeSeries(chart._zonaSeries.areaInf); } catch (e) {}
          }
          if (chart._zonaSeries.areaFutura) {
            try { chart.removeSeries(chart._zonaSeries.areaFutura); } catch (e) {}
          }
          if (chart._zonaSeries.lineaFutura) {
            try { chart.removeSeries(chart._zonaSeries.lineaFutura); } catch (e) {}
          }
          chart._zonaSeries = { areaSup: null, areaInf: null, areaFutura: null, lineaFutura: null };
        };

        chart._mostrarZona = (idx, conFuturo) => {
          chart._limpiarZona();

          if (idx < 0 || idx >= velas.length) return;

          const idxInicio = idx;
          const idxFin = Math.min(idxInicio + VENTANA, velas.length - 1);

          const fechas = [];
          const highs = [];
          const lows = [];

          for (let j = idxInicio; j <= idxFin; j++) {
            fechas.push(velas[j].date);
            highs.push(velas[j].high);
            lows.push(velas[j].low);
          }

          const maxH = Math.max(...highs);
          const minH = Math.min(...lows);

          const areaSup = chart.addAreaSeries({
            topColor: 'rgba(251, 191, 36, 0.25)',
            bottomColor: 'rgba(0,0,0,0)',
            lineColor: 'rgba(0,0,0,0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaSup.setData(fechas.map((f) => ({ time: f, value: maxH })));

          const areaInf = chart.addAreaSeries({
            topColor: 'rgba(0,0,0,0)',
            bottomColor: 'rgba(251, 191, 36, 0.25)',
            lineColor: 'rgba(0,0,0,0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaInf.setData(fechas.map((f) => ({ time: f, value: minH })));

          chart._zonaSeries = { areaSup, areaInf, areaFutura: null, lineaFutura: null };

          if (conFuturo) {
            const datosFuturos = [];
            for (let d = 1; d <= VENTANA; d++) {
              const idxVela = idxInicio + d;
              if (idxVela >= velas.length) break;
              const fechaFutura = sumarDiasHabiles(ultimaVela.date, d);
              const velaPasada = velas[idxVela];
              const velaAnterior = velas[idxVela - 1];
              const medio = (velaPasada.high + velaPasada.low) / 2;
              const medioAnterior = (velaAnterior.high + velaAnterior.low) / 2;
              const delta = medio - medioAnterior;
              datosFuturos.push({ fechaFutura, delta });
            }

            const lineaFuturaData = [{ time: ultimaVela.date, value: cierreActual }];
            let medioAcum = cierreActual;
            for (const df of datosFuturos) {
              medioAcum += df.delta;
              lineaFuturaData.push({ time: df.fechaFutura, value: medioAcum });
            }

            const areaFutura = chart.addAreaSeries({
              topColor: 'rgba(156, 163, 175, 0.10)',
              bottomColor: 'rgba(156, 163, 175, 0.10)',
              lineColor: 'rgba(0,0,0,0)',
              lineWidth: 1,
              priceScaleId: 'right',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false
            });
            areaFutura.setData(lineaFuturaData.map((p) => ({ time: p.time, value: p.value })));

            const lineaFutura = chart.addLineSeries({
              color: 'rgba(156, 163, 175, 0.7)',
              lineWidth: 1.5,
              lineStyle: LineStyle.Dashed,
              priceScaleId: 'right',
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: true
            });
            lineaFutura.setData(lineaFuturaData);

            chart._zonaSeries = {
              areaSup,
              areaInf,
              areaFutura,
              lineaFutura
            };
          }
        };

        function handleResize() {
          if (chart && contenedorRef.current) {
            chart.applyOptions({ width: contenedorRef.current.clientWidth });
          }
        }
        window.addEventListener('resize', handleResize);

        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          if (chart) chart.remove();
          chartRef.current = null;
        };
      } catch (e) {
        console.error('Error inicializando chart:', e);
      }
    }

    init();

    return () => {
      cancelado = true;
      cleanup();
    };
  }, [velas, smis]);

  // Efecto que se dispara cuando cambia la posición del slider
  useEffect(() => {
    if (!chartRef.current) return;
    if (!velas || velas.length === 0) return;

    const idx = posicion < 0 ? -1 : posicion;

    if (idx < 0) {
      // Sin selección: limpiar zona y volver al zoom por defecto
      chartRef.current._limpiarZona();
      setInfoSeleccion(null);
      const totalVelas = velas.length;
      const desde = Math.max(0, totalVelas - 1 - VELAS_ATRAS);
      const hasta = totalVelas;
      try {
        chartRef.current.timeScale().setVisibleLogicalRange({ from: desde, to: hasta });
      } catch (e) {}
      return;
    }

    // Mostrar zona seleccionada + proyección
    chartRef.current._mostrarZona(idx, true);

    // Calcular info de la selección
    const idxInicio = idx;
    const idxFin = Math.min(idxInicio + VENTANA, velas.length - 1);
    const precios = [];
    for (let j = idxInicio; j <= idxFin; j++) {
      precios.push(velas[j].low);
      precios.push(velas[j].high);
    }
    const precioMin = Math.min(...precios);
    const precioMax = Math.max(...precios);
    setInfoSeleccion({
      fecha: velas[idxInicio].date,
      fechaFin: velas[idxFin].date,
      precioMin,
      precioMax
    });

    // Zoom que incluye la zona seleccionada + el futuro
    const totalVelas = velas.length;
    const desde = Math.max(0, Math.min(idxInicio, totalVelas - 1 - VELAS_ATRAS));
    const hasta = totalVelas + VENTANA;
    try {
      chartRef.current.timeScale().setVisibleLogicalRange({ from: desde, to: hasta });
    } catch (e) {}
  }, [posicion, velas]);

  function handleSlider(e) {
    setPosicion(parseInt(e.target.value, 10));
  }

  const totalVelas = velas ? velas.length : 0;
  const maxSlider = totalVelas > 0 ? totalVelas - VENTANA - 1 : 0;

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico principal (diario)</h2>

      <details
        style={{
          marginBottom: '8px',
          fontSize: '13px',
          color: 'var(--v3-text-soft)'
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          Cómo leer este gráfico
        </summary>
        <div style={{ paddingTop: '8px', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 6px 0' }}>
            Cada vela representa una sesión: azul si cerró por encima de su apertura, gris si
            cerró por debajo. La línea naranja es la media del precio de cada vela. El indicador
            morado se sombrea en azul cuando supera +40 y en gris cuando baja de -40.
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            Mueve el control de abajo para explorar qué pasó en otras fechas. Al moverlo, se
            ilumina una zona del histórico y aparece una proyección gris muy tenue.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Importante:</strong> la proyección no es una predicción. Es una copia de lo
            que ocurrió en el pasado en una situación similar. No indica lo que va a pasar. No es
            una recomendación de inversión.
          </p>
        </div>
      </details>

      <div
        style={{
          marginBottom: '8px',
          padding: '8px 12px',
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#1e3a8a',
          lineHeight: 1.5
        }}
      >
        <strong>Herramienta de exploración histórica.</strong> Esta proyección la activas tú
        moviendo el control. No es una predicción ni una recomendación de inversión. Es una copia
        de lo que ocurrió en el pasado en una situación similar.
      </div>

      <div className="v3-card" style={{ padding: '4px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%' }} />
      </div>

      {/* Panel de control del slider */}
      <div
        style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: '#f9fafb',
          border: '1px solid var(--v3-border)',
          borderRadius: '6px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <label
            htmlFor="slider-explorar"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--v3-text)'
            }}
          >
            Explorar el pasado
          </label>
          <button
            onClick={() => setPosicion(-1)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '999px',
              border: '1px solid var(--v3-border)',
              background: '#fff',
              color: 'var(--v3-text)',
              cursor: 'pointer'
            }}
          >
            Volver a la vista actual
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            id="slider-explorar"
            type="range"
            min={0}
            max={maxSlider > 0 ? maxSlider : 0}
            value={posicion < 0 ? Math.floor(maxSlider / 2) : posicion}
            onChange={handleSlider}
            style={{
              width: '100%',
              height: '24px',
              cursor: 'pointer',
              accentColor: '#2563eb'
            }}
          />
          {/* Marcadores de coincidencias */}
          {coincidencias.length > 0 && maxSlider > 0 && (
            <div
              style={{
                position: 'relative',
                height: '8px',
                marginTop: '-6px',
                pointerEvents: 'none'
              }}
            >
              {coincidencias.map((c, i) => {
                const pct = (c.indexFecha / maxSlider) * 100;
                if (pct < 0 || pct > 100) return null;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${pct}%`,
                      top: 0,
                      width: '4px',
                      height: '8px',
                      background: '#f59e0b',
                      borderRadius: '2px',
                      transform: 'translateX(-50%)'
                    }}
                    title={`Coincidencia: ${formatearFecha(c.fecha)}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--v3-text-soft)',
            lineHeight: 1.5
          }}
        >
          {posicion < 0 ? (
            <>
              Mueve el control para explorar qué pasó en otras fechas. Las <strong>marcas naranjas</strong>{' '}
              indican fechas donde el indicador estuvo en una situación similar a la actual.
            </>
          ) : infoSeleccion ? (
            <>
              <strong>Explorando: {formatearFecha(infoSeleccion.fecha)} al{' '}
              {formatearFecha(infoSeleccion.fechaFin)}.</strong> En esas {VENTANA} sesiones, el
              precio se movió entre <strong>{infoSeleccion.precioMin.toFixed(2)} €</strong> y{' '}
              <strong>{infoSeleccion.precioMax.toFixed(2)} €</strong>. Esto no es una predicción,
              es una copia del pasado.
            </>
          ) : (
            'Selecciona una fecha para ver qué pasó.'
          )}
        </div>
      </div>
    </section>
  );
}
