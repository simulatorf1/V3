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

    const dias = [];
    for (let d = 1; d <= DIAS_EXTRA; d++) {
      dias.push({
        date: velas[i + d].date,
        high: velas[i + d].high,
        low: velas[i + d].low
      });
    }

    return {
      fecha: velas[i].date,
      smi: v,
      dias
    };
  }

  return null;
}

export default function GraficoPrecedentes({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const [precedente, setPrecedente] = useState(null);
  const [chartListo, setChartListo] = useState(false);
  const [diag, setDiag] = useState('');

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

    const timer = setTimeout(() => {
      dibujarOverlay();
    }, 200);

    return () => clearTimeout(timer);
  }, [chartListo, precedente, velas]);

  function dibujarOverlay() {
    try {
      const contenedor = contenedorRef.current;
      const overlay = overlayRef.current;
      const chart = chartRef.current;
      if (!contenedor || !overlay || !chart) {
        setDiag('fallo: contenedor/overlay/chart null');
        return;
      }
      if (!precedente) {
        setDiag('fallo: precedente null');
        return;
      }
      if (!velas || velas.length < 2) {
        setDiag('fallo: velas < 2');
        return;
      }

      const width = contenedor.clientWidth;
      const height = contenedor.clientHeight;
      if (width === 0 || height === 0) {
        setDiag(`fallo: width=${width} height=${height}`);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      overlay.width = width * dpr;
      overlay.height = height * dpr;
      overlay.style.width = width + 'px';
      overlay.style.height = height + 'px';

      const ctx = overlay.getContext('2d');
      if (!ctx) {
        setDiag('fallo: ctx null');
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const timeScale = chart.timeScale();
      const priceScale = chart.priceScale('right');

      const ultimaVela = velas[velas.length - 1];
      const xUltima = timeScale.timeToCoordinate(ultimaVela.date);
      const penultimaVela = velas[velas.length - 2];
      const xPenultima = timeScale.timeToCoordinate(penultimaVela.date);

      const info = [];
      info.push(`width=${width}`);
      info.push(`height=${height}`);
      info.push(`xUltima=${xUltima !== null && xUltima !== undefined ? Math.round(xUltima) : 'NULL'}`);
      info.push(`xPenultima=${xPenultima !== null && xPenultima !== undefined ? Math.round(xPenultima) : 'NULL'}`);

      if (xUltima === null || xUltima === undefined) {
        setDiag(info.join(' · '));
        return;
      }
      if (xPenultima === null || xPenultima === undefined) {
        setDiag(info.join(' · '));
        return;
      }

      const anchoVela = xUltima - xPenultima;
      info.push(`anchoVela=${Math.round(anchoVela)}`);

      if (anchoVela <= 0) {
        setDiag(info.join(' · '));
        return;
      }

      const puntosSuperior = [];
      const puntosInferior = [];

      precedente.dias.forEach((d, i) => {
        const x = xUltima + (i + 1) * anchoVela;
        const ySup = priceScale.priceToCoordinate(d.high);
        const yInf = priceScale.priceToCoordinate(d.low);
        if (ySup !== null && ySup !== undefined && yInf !== null && yInf !== undefined) {
          puntosSuperior.push({ x, y: ySup });
          puntosInferior.push({ x, y: yInf });
        }
      });

      info.push(`puntosSup=${puntosSuperior.length}`);
      info.push(`puntosInf=${puntosInferior.length}`);
      setDiag(info.join(' · '));

      if (puntosSuperior.length === 0) return;

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

      ctx.beginPath();
      ctx.moveTo(puntosSuperior[0].x, puntosSuperior[0].y);
      for (let i = 1; i < puntosSuperior.length; i++) {
        ctx.lineTo(puntosSuperior[i].x, puntosSuperior[i].y);
      }
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(puntosInferior[0].x, puntosInferior[0].y);
      for (let i = 1; i < puntosInferior.length; i++) {
        ctx.lineTo(puntosInferior[i].x, puntosInferior[i].y);
      }
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } catch (e) {
      setDiag('excepción: ' + e.message);
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
        <strong>CHART LISTO:</strong> {chartListo ? 'sí' : 'no'}
        <br />
        <strong>PRECEDENTE:</strong> {precedente ? precedente.fecha : 'NO'}
        <br />
        <strong>DIAGNÓSTICO:</strong> {diag || 'vacío'}
      </div>
    </section>
  );
}
