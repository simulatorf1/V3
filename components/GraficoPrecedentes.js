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
      const vela = velas[i + d];
      const velaAnterior = velas[i + d - 1];
      dias.push({
        date: vela.date,
        // Diferencias absolutas entre días consecutivos
        deltaHigh: vela.high - velaAnterior.high,
        deltaLow: vela.low - velaAnterior.low
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

function sumarDias(fechaStr, dias) {
  const f = new Date(fechaStr + 'T00:00:00');
  f.setDate(f.getDate() + dias);
  return f.toISOString().slice(0, 10);
}

export default function GraficoPrecedentes({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const chartRef = useRef(null);
  const [precedente, setPrecedente] = useState(null);

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
          timeScale: { borderColor: '#ddd', rightOffset: 15 },
          rightPriceScale: { borderColor: '#ddd', scaleMargins: { top: 0.1, bottom: 0.1 } },
          leftPriceScale: {
            borderColor: '#ddd',
            visible: true,
            scaleMargins: { top: 0.1, bottom: 0.1 }
          }
        });

        chartRef.current = chart;

        const ultimaVela = velas[velas.length - 1];
        const highActual = ultimaVela.high;
        const lowActual = ultimaVela.low;

        // Calcular el rango Y solo con los datos históricos
        let minY = Infinity;
        let maxY = -Infinity;
        for (const v of velas) {
          minY = Math.min(minY, v.low);
          maxY = Math.max(maxY, v.high);
        }
        const margen = (maxY - minY) * 0.1;
        minY -= margen;
        maxY += margen;

        // Velas reales
        const velasReales = velas.map((v) => ({
          time: v.date,
          open: v.open,
          high: v.high,
          low: v.low,
          close: v.close
        }));

        const velasSeries = chart.addCandlestickSeries({
          upColor: '#2563eb',
          downColor: '#9ca3af',
          borderUpColor: '#2563eb',
          borderDownColor: '#9ca3af',
          wickUpColor: '#2563eb',
          wickDownColor: '#9ca3af',
          priceScaleId: 'right'
        });
        velasSeries.setData(velasReales);

        // Bandas reales
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

        // Bandas futuras: acumular diferencias consecutivas
        if (precedente) {
          const bandaSupFuturaData = [{ time: ultimaVela.date, value: highActual }];
          const bandaInfFuturaData = [{ time: ultimaVela.date, value: lowActual }];

          let highAcum = highActual;
          let lowAcum = lowActual;

          for (let i = 0; i < precedente.dias.length; i++) {
            const d = precedente.dias[i];
            const fechaFutura = sumarDias(ultimaVela.date, i + 1);
            highAcum += d.deltaHigh;
            lowAcum += d.deltaLow;
            bandaSupFuturaData.push({ time: fechaFutura, value: highAcum });
            bandaInfFuturaData.push({ time: fechaFutura, value: lowAcum });
          }

          const bandaSupFutura = chart.addLineSeries({
            color: 'rgba(37, 99, 235, 0.7)',
            lineWidth: 1.5,
            lineStyle: LineStyle.Dashed,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          bandaSupFutura.setData(bandaSupFuturaData);

          const bandaInfFutura = chart.addLineSeries({
            color: 'rgba(156, 163, 175, 0.7)',
            lineWidth: 1.5,
            lineStyle: LineStyle.Dashed,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          bandaInfFutura.setData(bandaInfFuturaData);
        }

        // Indicador Equaty
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

        // Fijar el rango Y después de fitContent
        setTimeout(() => {
          if (chart) {
            try {
              chart.priceScale('right').setVisibleRange({ from: minY, to: maxY });
            } catch (e) {}
          }
        }, 100);

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
  }, [velas, smis, precedente]);

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico con precedentes (pruebas)</h2>

      <div className="v3-card" style={{ padding: '12px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%', height: '520px' }} />
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        Las líneas discontinuas a la derecha son la proyección del precedente. Se calculan
        acumulando las diferencias entre días consecutivos del precedente (en euros) sobre el high y
        low actuales. Así la forma es idéntica a la del precedente, sin escalado.
      </p>
    </section>
  );
}
