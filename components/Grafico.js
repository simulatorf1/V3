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

      // Datos de precio
      const precioData = velas.map((v) => ({
        time: v.date,
        value: v.close
      }));

      // Datos del SMI alineados con velas
      const smiData = [];
      for (let i = 0; i < smis.length; i++) {
        if (smis[i] === null || smis[i] === undefined) continue;
        if (!velas[i]) continue;
        smiData.push({
          time: velas[i].date,
          value: smis[i]
        });
      }

      // Datos para la zona alta (>40): solo pintamos cuando el SMI está por encima
      const zonaAltaData = [];
      for (let i = 0; i < smis.length; i++) {
        if (!velas[i]) continue;
        const v = smis[i];
        if (v !== null && v !== undefined && v > 40) {
          zonaAltaData.push({ time: velas[i].date, value: v });
        } else {
          // Punto "hueco" para que no conecte líneas entre zonas
          zonaAltaData.push({ time: velas[i].date });
        }
      }

      // Datos para la zona baja (<-40): solo pintamos cuando el SMI está por debajo
      const zonaBajaData = [];
      for (let i = 0; i < smis.length; i++) {
        if (!velas[i]) continue;
        const v = smis[i];
        if (v !== null && v !== undefined && v < -40) {
          zonaBajaData.push({ time: velas[i].date, value: v });
        } else {
          zonaBajaData.push({ time: velas[i].date });
        }
      }

      // --- Gráfico único con dos ejes ---
      chart = createChart(contenedorRef.current, {
        width: contenedorRef.current.clientWidth,
        height: 480,
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
        },
        rightPriceScale: {
          borderColor: '#ddd',
          scaleMargins: { top: 0.1, bottom: 0.1 }
        },
        leftPriceScale: {
          borderColor: '#ddd',
          visible: true,
          scaleMargins: { top: 0.1, bottom: 0.1 }
        }
      });

      // Serie de precio (eje derecho)
      const precioLine = chart.addLineSeries({
        color: '#0070f3',
        lineWidth: 2,
        title: 'Precio',
        priceScaleId: 'right'
      });
      precioLine.setData(precioData);

      // Serie del SMI (eje izquierdo)
      const smiLine = chart.addLineSeries({
        color: '#7b1fa2',
        lineWidth: 2,
        title: 'Indicador propietario',
        priceScaleId: 'left'
      });
      smiLine.setData(smiData);

      // Zona alta sombreada (rojo claro)
      const zonaAltaArea = chart.addAreaSeries({
        topColor: 'rgba(198, 40, 40, 0.25)',
        bottomColor: 'rgba(198, 40, 40, 0.05)',
        lineColor: 'rgba(198, 40, 40, 0.4)',
        lineWidth: 1,
        priceScaleId: 'left',
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      zonaAltaArea.setData(zonaAltaData);

      // Zona baja sombreada (verde claro)
      const zonaBajaArea = chart.addAreaSeries({
        topColor: 'rgba(46, 125, 50, 0.25)',
        bottomColor: 'rgba(46, 125, 50, 0.05)',
        lineColor: 'rgba(46, 125, 50, 0.4)',
        lineWidth: 1,
        priceScaleId: 'left',
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      zonaBajaArea.setData(zonaBajaData);

      // Bandas del SMI (zona alta / baja) en el eje izquierdo
      smiLine.createPriceLine({
        price: 40,
        color: '#c62828',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'zona alta',
        priceScaleId: 'left'
      });
      smiLine.createPriceLine({
        price: -40,
        color: '#2e7d32',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'zona baja',
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

      // Rango fijo del SMI en el eje izquierdo (-100 a +100)
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
    <div style={{ marginTop: '30px' }}>
      <h2>Gráfico principal</h2>
      <div ref={contenedorRef} style={{ width: '100%' }} />
      <p style={{ color: '#666', fontSize: '13px', marginTop: '10px' }}>
        El eje derecho muestra el precio (línea azul) y el eje izquierdo el indicador propietario
        (línea morada). Las zonas roja y verde sombreadas marcan los tramos en los que el indicador
        se sitúa por encima de +40 (zona alta) o por debajo de -40 (zona baja). No es una
        recomendación de inversión.
      </p>
    </div>
  );
}
