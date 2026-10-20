'use client';

import { useEffect, useRef } from 'react';

export default function Grafico({ velas, smis }) {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!velas || velas.length === 0) return;

    let chart;
    let cleanup = () => {};

    async function init() {
      const { createChart, LineStyle } = await import('lightweight-charts');

      const precioData = velas.map((v) => ({ time: v.date, value: v.close }));

      const smiData = [];
      for (let i = 0; i < smis.length; i++) {
        if (smis[i] === null || smis[i] === undefined) continue;
        if (!velas[i]) continue;
        smiData.push({ time: velas[i].date, value: smis[i] });
      }

      chart = createChart(contenedorRef.current, {
        width: contenedorRef.current.clientWidth,
        height: 480,
        layout: { background: { color: '#ffffff' }, textColor: '#333' },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' }
        },
        timeScale: { borderColor: '#ddd' },
        rightPriceScale: { borderColor: '#ddd', scaleMargins: { top: 0.1, bottom: 0.1 } },
        leftPriceScale: {
          borderColor: '#ddd',
          visible: true,
          scaleMargins: { top: 0.1, bottom: 0.1 }
        }
      });

      const precioLine = chart.addLineSeries({
        color: '#0b5fff',
        lineWidth: 2,
        title: 'Precio',
        priceScaleId: 'right'
      });
      precioLine.setData(precioData);

      // Categoría A: azul
      const categoriaABaseline = chart.addBaselineSeries({
        baseValue: { type: 'price', price: 40 },
        topFillColor1: 'rgba(37, 99, 235, 0.45)',
        topFillColor2: 'rgba(37, 99, 235, 0.12)',
        bottomFillColor1: 'rgba(37, 99, 235, 0)',
        bottomFillColor2: 'rgba(37, 99, 235, 0)',
        topLineColor: 'rgba(37, 99, 235, 0.4)',
        bottomLineColor: 'rgba(37, 99, 235, 0)',
        lineWidth: 1,
        priceScaleId: 'left',
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      categoriaABaseline.setData(smiData);

      // Categoría C: gris
      const categoriaCBaseline = chart.addBaselineSeries({
        baseValue: { type: 'price', price: -40 },
        topFillColor1: 'rgba(156, 163, 175, 0)',
        topFillColor2: 'rgba(156, 163, 175, 0)',
        bottomFillColor1: 'rgba(156, 163, 175, 0.45)',
        bottomFillColor2: 'rgba(156, 163, 175, 0.12)',
        topLineColor: 'rgba(156, 163, 175, 0)',
        bottomLineColor: 'rgba(156, 163, 175, 0.4)',
        lineWidth: 1,
        priceScaleId: 'left',
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      categoriaCBaseline.setData(smiData);

      const smiLine = chart.addLineSeries({
        color: '#7b1fa2',
        lineWidth: 2,
        title: 'Indicador estadístico descriptivo',
        priceScaleId: 'left'
      });
      smiLine.setData(smiData);

      smiLine.createPriceLine({
        price: 40,
        color: '#2563eb',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Categoría A',
        priceScaleId: 'left'
      });
      smiLine.createPriceLine({
        price: -40,
        color: '#9ca3af',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Categoría C',
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
      };
    }

    init();

    return () => cleanup();
  }, [velas, smis]);

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico principal</h2>
      <div className="v3-card" style={{ padding: '12px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%' }} />
      </div>
      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '10px' }}>
        El eje derecho muestra el precio (línea azul) y el eje izquierdo el indicador estadístico
        descriptivo (línea morada). El área azul aparece solo cuando el indicador supera +40 y el
        área gris solo cuando cae por debajo de -40. Esta representación es exclusivamente
        descriptiva de datos históricos y no constituye recomendación de inversión.
      </p>
    </section>
  );
}
