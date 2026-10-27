'use client';

import { useEffect, useRef, useState } from 'react';

const DIAS_EXTRA = 5;
const RANGO_VALOR = 30;

function calcularPendiente(smis, idx) {
  if (idx < 5) return null;
  const actual = smis[idx];
  const hace5 = smis[idx - 5];
  if (actual === null || actual === undefined || hace5 === null || hace5 === undefined) {
    return null;
  }
  return actual - hace5;
}

function buscarPrecedente(velas, smis, smiActual) {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) return null;
  if (smiActual === null || smiActual === undefined) return null;

  const idxActual = smis.length - 1;
  const pendienteActual = calcularPendiente(smis, idxActual);

  for (let i = idxActual - 1; i >= 0; i--) {
    if (i + DIAS_EXTRA >= velas.length) continue;

    const v = smis[i];
    if (v === null || v === undefined) continue;
    if (Math.abs(v - smiActual) > RANGO_VALOR) continue;

    const pend = calcularPendiente(smis, i);
    if (pend === null) continue;

    if (pendienteActual !== null) {
      if (pendienteActual >= 0 && pend < 0) continue;
      if (pendienteActual < 0 && pend >= 0) continue;
    }

    // Guardamos el high y low del día 0 del precedente, para calcular variaciones relativas
    const highBase = velas[i].high;
    const lowBase = velas[i].low;

    const dias = [];
    // Día 0: el high y low del día del precedente
    dias.push({
      high: highBase,
      low: lowBase,
      variacionHigh: 0,
      variacionLow: 0
    });

    for (let d = 1; d <= DIAS_EXTRA; d++) {
      const vela = velas[i + d];
      dias.push({
        high: vela.high,
        low: vela.low,
        variacionHigh: highBase !== 0 ? (vela.high - highBase) / highBase : 0,
        variacionLow: lowBase !== 0 ? (vela.low - lowBase) / lowBase : 0
      });
    }

    return {
      fecha: velas[i].date,
      smi: v,
      highBase,
      lowBase,
      dias
    };
  }

  return null;
}

export default function GraficoPrecedentes({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const velasSeriesRef = useRef(null);
  const [precedente, setPrecedente] = useState(null);
  const [chartListo, setChartListo] = useState(false);

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    setPrecedente(buscarPrecedente(velas, smis, smiActual));
  }, [velas, smis, smiActual]);

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    if (!contenedorRef.current) return;

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
    }
    velasSeriesRef.current = null;

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
          height: 520,
          layout: { background: { color: '#ffffff' }, textColor: '#333' },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' }
          },
          timeScale: { borderColor: '#ddd', rightOffset: 10 },
          rightPriceScale: { borderColor: '#ddd', scaleMargins: { top: 0.1, bottom: 0.1 } },
          leftPriceScale: {
            borderColor: '#ddd',
            visible: true,
            scaleMargins: { top: 0.1, bottom: 0.1 }
          }
        });

        chartRef.current = chart;

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
        velasSeriesRef.current = velasSeries;

        const bandaSuperior = chart.addLineSeries({
          color: '#2563eb',
          lineWidth: 1,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        bandaSuperior.setData(velas.map((v) => ({ time: v.date, value: v.high })));

        const bandaInferior = chart.addLineSeries({
          color: '#9ca3af',
          lineWidth: 1,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        bandaInferior.setData(velas.map((v) => ({ time: v.date, value: v.low })));

        const smiData = [];
        for (let i = 0; i < smis.length; i++) {
          if (smis[i] === null || smis[i] === undefined) continue;
          if (!velas[i]) continue;
          smiData.push({ time: velas[i].date, value: smis[i] });
        }

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
          scaleMargins: { top: 0.1, bottom: 0.1 }
        });
        smiLine.applyOptions({
          autoscaleInfoProvider: () => ({
            priceRange: { minValue: -100, maxValue: 100 }
          })
        });

        chart.timeScale().fitContent();

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
          velasSeriesRef.current = null;
        };

        setTimeout(() => {
          if (!cancelado) setChartListo(true);
        }, 800);
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

  useEffect(() => {
    if (!chartListo) return;
    if (!precedente) return;
    if (!velas || velas.length < 2) return;
    if (!contenedorRef.current || !overlayRef.current) return;
    if (!chartRef.current) return;
    if (!velasSeriesRef.current) return;

    const chart = chartRef.current;
    const timeScale = chart.timeScale();

    const redibujar = () => {
      dibujarOverlay();
    };

    const timer = setTimeout(redibujar, 200);
    timeScale.subscribeVisibleLogicalRangeChange(redibujar);

    return () => {
      clearTimeout(timer);
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(redibujar);
      } catch (e) {}
    };
  }, [chartListo, precedente, velas]);

  function dibujarOverlay() {
    try {
      const contenedor = contenedorRef.current;
      const overlay = overlayRef.current;
      const chart = chartRef.current;
      const serie = velasSeriesRef.current;
      if (!contenedor || !overlay || !chart || !serie) return;
      if (!precedente) return;
      if (!velas || velas.length < 2) return;

      const width = contenedor.clientWidth;
      const height = contenedor.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      overlay.width = width * dpr;
      overlay.height = height * dpr;
      overlay.style.width = width + 'px';
      overlay.style.height = height + 'px';

      const ctx = overlay.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const timeScale = chart.timeScale();

      // Última vela real
      const ultimaVela = velas[velas.length - 1];
      const highActual = ultimaVela.high;
      const lowActual = ultimaVela.low;

      // Coordenada lógica de la última vela (índice en el eje lógico del gráfico)
      const ultimoIndiceLogico = velas.length - 1;

      // Coordenada X de la última vela real
      const xUltima = timeScale.logicalToCoordinate(ultimoIndiceLogico);
      if (xUltima === null || xUltima === undefined) return;

      // Coordenada X del índice lógico anterior, para calcular el ancho por unidad lógica
      const xAnterior = timeScale.logicalToCoordinate(ultimoIndiceLogico - 1);
      if (xAnterior === null || xAnterior === undefined) return;

      const anchoUnidadLogica = xUltima - xAnterior;
      if (anchoUnidadLogica <= 0) return;

      // Calcular puntos: para cada día del precedente, X = xUltima + i * anchoUnidadLogica
      const puntosSuperior = [];
      const puntosInferior = [];

      precedente.dias.forEach((d, i) => {
        const x = xUltima + i * anchoUnidadLogica;
        const precioHighFuturo = highActual * (1 + d.variacionHigh);
        const precioLowFuturo = lowActual * (1 + d.variacionLow);
        const ySup = serie.priceToCoordinate(precioHighFuturo);
        const yInf = serie.priceToCoordinate(precioLowFuturo);
        if (ySup !== null && ySup !== undefined && yInf !== null && yInf !== undefined) {
          puntosSuperior.push({ x, y: ySup });
          puntosInferior.push({ x, y: yInf });
        }
      });

      if (puntosSuperior.length === 0) return;

      const primerX = puntosSuperior[0].x;
      if (primerX > width || puntosSuperior[puntosSuperior.length - 1].x < 0) return;

      // Banda sombreada
      ctx.beginPath();
      ctx.moveTo(puntosSuperior[0].x, puntosSuperior[0].y);
      for (let i = 1; i < puntosSuperior.length; i++) {
        ctx.lineTo(puntosSuperior[i].x, puntosSuperior[i].y);
      }
      for (let i = puntosInferior.length - 1; i >= 0; i--) {
        ctx.lineTo(puntosInferior[i].x, puntosInferior[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
      ctx.fill();

      // Línea superior
      ctx.beginPath();
      ctx.moveTo(puntosSuperior[0].x, puntosSuperior[0].y);
      for (let i = 1; i < puntosSuperior.length; i++) {
        ctx.lineTo(puntosSuperior[i].x, puntosSuperior[i].y);
      }
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Línea inferior
      ctx.beginPath();
      ctx.moveTo(puntosInferior[0].x, puntosInferior[0].y);
      for (let i = 1; i < puntosInferior.length; i++) {
        ctx.lineTo(puntosInferior[i].x, puntosInferior[i].y);
      }
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } catch (e) {
      console.error('Error dibujando overlay:', e);
    }
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico con precedentes (pruebas)</h2>

      <div
        className="v3-card"
        style={{ padding: '12px', background: '#fff', position: 'relative' }}
      >
        <div ref={contenedorRef} style={{ width: '100%', height: '520px' }} />
        <canvas
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />
      </div>
    </section>
  );
}
