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

function buscarPrecedente(velas, smis, smiActual, setDiag) {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) {
    setDiag('velas o smis insuficientes');
    return null;
  }
  if (smiActual === null || smiActual === undefined) {
    setDiag('smiActual null');
    return null;
  }

  const idxActual = smis.length - 1;
  const pendienteActual = calcularPendiente(smis, idxActual);

  let totalRevisados = 0;
  let pasanRango = 0;
  let pasanPendiente = 0;
  let pasanVelasDespues = 0;

  for (let i = idxActual - 1; i >= 0; i--) {
    totalRevisados++;

    if (i + DIAS_EXTRA >= velas.length) continue;
    pasanVelasDespues++;

    const v = smis[i];
    if (v === null || v === undefined) continue;
    if (Math.abs(v - smiActual) > RANGO_VALOR) continue;
    pasanRango++;

    const pend = calcularPendiente(smis, i);
    if (pend === null) continue;

    if (pendienteActual !== null) {
      if (pendienteActual >= 0 && pend < 0) continue;
      if (pendienteActual < 0 && pend >= 0) continue;
    }
    pasanPendiente++;

    const dias = [];
    for (let d = 1; d <= DIAS_EXTRA; d++) {
      dias.push({
        date: velas[i + d].date,
        high: velas[i + d].high,
        low: velas[i + d].low
      });
    }

    setDiag(
      `smiActual=${smiActual.toFixed(1)} pendActual=${pendienteActual !== null ? pendienteActual.toFixed(1) : 'null'} · revisados=${totalRevisados} · velasDespues=${pasanVelasDespues} · rango=${pasanRango} · pendiente=${pasanPendiente} · ENCONTRADO en ${velas[i].date}`
    );

    return {
      fecha: velas[i].date,
      smi: v,
      dias
    };
  }

  setDiag(
    `smiActual=${smiActual.toFixed(1)} pendActual=${pendienteActual !== null ? pendienteActual.toFixed(1) : 'null'} · revisados=${totalRevisados} · velasDespues=${pasanVelasDespues} · rango=${pasanRango} · pendiente=${pasanPendiente} · NINGUNO`
  );

  return null;
}

export default function GraficoPrecedentes({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const [precedente, setPrecedente] = useState(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [chartListo, setChartListo] = useState(false);

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    const p = buscarPrecedente(velas, smis, smiActual, setDiagnostico);
    setPrecedente(p);
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

    setChartListo(false);

    let chart;
    let cleanup = () => {};

    async function init() {
      const { createChart, LineStyle } = await import('lightweight-charts');

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
        setChartListo(false);
      };

      // Marcar el chart como listo tras un pequeño retardo
      setTimeout(() => setChartListo(true), 500);
    }

    init();

    return () => cleanup();
  }, [velas, smis]);

  // Este efecto dibuja el overlay cuando:
  // - el chart está listo
  // - hay precedente
  // - hay velas
  useEffect(() => {
    if (!chartListo) return;
    if (!precedente) return;
    if (!velas || velas.length < 2) return;
    if (!contenedorRef.current || !overlayRef.current || !chartRef.current) return;

    dibujarOverlay();

    // Redibujar también cuando el usuario hace zoom o scroll
    const chart = chartRef.current;
    const timeScale = chart.timeScale();
    const handler = () => dibujarOverlay();
    timeScale.subscribeVisibleLogicalRangeChange(handler);

    return () => {
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(handler);
      } catch (e) {}
    };
  }, [chartListo, precedente, velas]);

  function dibujarOverlay() {
    const contenedor = contenedorRef.current;
    const overlay = overlayRef.current;
    const chart = chartRef.current;
    if (!contenedor || !overlay || !chart) return;
    if (!precedente || !precedente.dias || precedente.dias.length === 0) return;
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const timeScale = chart.timeScale();
    const priceScale = chart.priceScale('right');

    const ultimaVela = velas[velas.length - 1];
    const xUltima = timeScale.timeToCoordinate(ultimaVela.date);
    if (xUltima === null) return;

    const penultimaVela = velas[velas.length - 2];
    const xPenultima = timeScale.timeToCoordinate(penultimaVela.date);
    if (xPenultima === null) return;

    const anchoVela = xUltima - xPenultima;
    if (anchoVela <= 0) return;

    const puntosSuperior = [];
    const puntosInferior = [];

    precedente.dias.forEach((d, i) => {
      const x = xUltima + (i + 1) * anchoVela;
      const ySup = priceScale.priceToCoordinate(d.high);
      const yInf = priceScale.priceToCoordinate(d.low);
      if (ySup !== null && yInf !== null) {
        puntosSuperior.push({ x, y: ySup });
        puntosInferior.push({ x, y: yInf });
      }
    });

    if (puntosSuperior.length === 0) return;

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

    // Línea vertical discontinua
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xUltima + anchoVela / 2, 0);
    ctx.lineTo(xUltima + anchoVela / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Texto
    ctx.fillStyle = 'rgba(37, 99, 235, 0.9)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const xCentro =
      (puntosSuperior[0].x + puntosSuperior[puntosSuperior.length - 1].x) / 2;
    ctx.fillText('última vez que estuvo así', xCentro, 18);
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

      <div
        style={{
          marginTop: '12px',
          padding: '12px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: 1.6,
          fontFamily: 'monospace',
          wordBreak: 'break-word'
        }}
      >
        <strong>DIAGNÓSTICO:</strong> {diagnostico || 'vacío'}
        <br />
        <strong>CHART LISTO:</strong> {chartListo ? 'sí' : 'no'}
        <br />
        <strong>PRECEDENTE:</strong> {precedente ? precedente.fecha : 'NO'}
      </div>
    </section>
  );
}
