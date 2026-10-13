'use client';

import { useEffect, useRef } from 'react';

export default function Grafico({ velas, smis }) {
  const precioRef = useRef(null);
  const smiRef = useRef(null);

  useEffect(() => {
    if (!velas || velas.length === 0) return;

    let precioChart, smiChart;
    let cleanup = () => {};

    async function init() {
      const { createChart, LineStyle } = await import('lightweight-charts');

      // Datos de precio (línea)
      const precioData = velas.map((v) => ({
        time: v.date,
        value: v.close
      }));

      // Datos del SMI
      const smiData = [];
      for (let i = 0; i < smis.length; i++) {
        if (smis[i] === null || smis[i] === undefined) continue;
        if (!velas[i]) continue;
        smiData.push({
          time: velas[i].date,
          value: smis[i]
        });
      }

      // --- Gráfico de precio ---
      precioChart = createChart(precioRef.current, {
        width: precioRef.current.clientWidth,
        height: 320,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333'
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' }
        },
        timeScale: {
          borderColor: '#ddd'
        }
      });

      const precioLine = precioChart.addLineSeries({
        color: '#0070f3',
        lineWidth: 2,
        title: 'Precio'
      });
      precioLine.setData(precioData);

      // Bandas horizontales en el gráfico de precio (referencia visual)
      precioLine.createPriceLine({
        price: Math.max(...precioData.map((d) => d.value)),
        color: '#c62828',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Máx 60 sesiones'
      });
      precioLine.createPriceLine({
        price: Math.min(...precioData.map((d) => d.value)),
        color: '#2e7d32',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Mín 60 sesiones'
      });

      precioChart.timeScale().fitContent();

      // --- Gráfico del SMI ---
      smiChart = createChart(smiRef.current, {
        width: smiRef.current.clientWidth,
        height: 200,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333'
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' }
        },
        timeScale: {
          borderColor: '#ddd'
        }
      });

      const smiLine = smiChart.addLineSeries({
        color: '#7b1fa2',
        lineWidth: 2,
        title: 'Indicador propietario'
      });
      smiLine.setData(smiData);

      // Bandas de zona alta / baja
      smiLine.createPriceLine({
        price: 40,
        color: '#c62828',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'zona alta'
      });
      smiLine.createPriceLine({
        price: -40,
        color: '#2e7d32',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'zona baja'
      });
      smiLine.createPriceLine({
        price: 0,
        color: '#aaa',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: false
      });

      smiChart.timeScale().fitContent();

      // Redimensionado
      function handleResize() {
        if (precioChart && precioRef.current) {
          precioChart.applyOptions({ width: precioRef.current.clientWidth });
        }
        if (smiChart && smiRef.current) {
          smiChart.applyOptions({ width: smiRef.current.clientWidth });
        }
      }
      window.addEventListener('resize', handleResize);

      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        if (precioChart) precioChart.remove();
        if (smiChart) smiChart.remove();
      };
    }

    init();

    return () => cleanup();
  }, [velas, smis]);

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Gráfico principal</h2>
      <div ref={precioRef} style={{ width: '100%' }} />
      <div ref={smiRef} style={{ width: '100%', marginTop: '10px' }} />
      <p style={{ color: '#666', fontSize: '13px', marginTop: '10px' }}>
        Este gráfico muestra las últimas 60 sesiones. Las bandas "zona alta" y "zona baja" marcan los umbrales
        estadísticos del indicador propietario. No es una recomendación de inversión.
      </p>
    </div>
  );
}
