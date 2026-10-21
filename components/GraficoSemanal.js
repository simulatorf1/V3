'use client';

import { useEffect, useRef } from 'react';

export default function GraficoSemanal({ velas }) {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!velas || velas.length === 0) return;

    let chart;
    let cleanup = () => {};

    async function init() {
      const { createChart } = await import('lightweight-charts');

      const velasData = velas.map((v) => ({
        time: v.date,
        open: v.open,
        high: v.high,
        low: v.low,
        close: v.close
      }));

      chart = createChart(contenedorRef.current, {
        width: contenedorRef.current.clientWidth,
        height: 360,
        layout: { background: { color: '#ffffff' }, textColor: '#333' },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' }
        },
        timeScale: { borderColor: '#ddd' },
        rightPriceScale: { borderColor: '#ddd', scaleMargins: { top: 0.1, bottom: 0.1 } }
      });

      const velasSeries = chart.addCandlestickSeries({
        upColor: '#2563eb',
        downColor: '#9ca3af',
        borderUpColor: '#2563eb',
        borderDownColor: '#9ca3af',
        wickUpColor: '#2563eb',
        wickDownColor: '#9ca3af',
        priceScaleId: 'right'
      });
      velasSeries.setData(velasData);

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
  }, [velas]);

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Evolución semanal del precio</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '14px', marginTop: '-4px' }}>
        Cada vela representa una semana. Las velas azules indican semanas al alza y las grises
        semanas a la baja. Esta vista permite observar el comportamiento del precio en un periodo
        más amplio.
      </p>
      <div className="v3-card" style={{ padding: '12px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%' }} />
      </div>
      <p style={{ color: 'var(--v3-text-mute)', fontSize: '13px', marginTop: '10px' }}>
        Este gráfico representa exclusivamente información histórica ya ocurrida. No identifica
        oportunidades de inversión, no anticipa movimientos futuros y no constituye recomendación
        de inversión.
      </p>
    </section>
  );
}
