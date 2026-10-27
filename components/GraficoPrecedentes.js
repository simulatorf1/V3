'use client';

import { useEffect, useRef, useState } from 'react';

const DIAS_EXTRA = 5;
const RANGO_VALOR = 5;
const MAX_PRECEDENTES = 5;

function calcularPendiente(smis, idx) {
  if (idx < 5) return null;
  const actual = smis[idx];
  const hace5 = smis[idx - 5];
  if (actual === null || actual === undefined || hace5 === null || hace5 === undefined) {
    return null;
  }
  return actual - hace5;
}

function buscarPrecedentes(velas, smis, smiActual) {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) return [];
  if (smiActual === null || smiActual === undefined) return [];

  const idxActual = smis.length - 1;
  const pendienteActual = calcularPendiente(smis, idxActual);

  const candidatos = [];

  for (let i = idxActual - 10; i >= 10; i--) {
    const v = smis[i];
    if (v === null || v === undefined) continue;
    if (Math.abs(v - smiActual) > RANGO_VALOR) continue;

    const pend = calcularPendiente(smis, i);
    if (pend === null) continue;

    // Misma dirección de pendiente (positiva o negativa)
    if (pendienteActual !== null) {
      if (pendienteActual >= 0 && pend < 0) continue;
      if (pendienteActual < 0 && pend >= 0) continue;
    }

    // Necesitamos 5 velas siguientes
    if (i + DIAS_EXTRA >= velas.length) continue;

    const dias = [];
    for (let d = 1; d <= DIAS_EXTRA; d++) {
      dias.push({
        date: velas[i + d].date,
        high: velas[i + d].high,
        low: velas[i + d].low
      });
    }

    candidatos.push({
      fecha: velas[i].date,
      smi: v,
      dias
    });

    if (candidatos.length >= MAX_PRECEDENTES) break;
  }

  return candidatos;
}

export default function GraficoPrecedentes({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const chartRef = useRef(null);
  const [precedentes, setPrecedentes] = useState([]);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    const precedentesCalculados = buscarPrecedentes(velas, smis, smiActual);
    setPrecedentes(precedentesCalculados);
  }, [velas, smis, smiActual]);

  useEffect(() => {
    if (!velas || velas.length === 0) return;

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
        timeScale: { borderColor: '#ddd', rightOffset: 12 },
        rightPriceScale: { borderColor: '#ddd', scaleMargins: { top: 0.1, bottom: 0.1 } },
        leftPriceScale: {
          borderColor: '#ddd',
          visible: true,
          scaleMargins: { top: 0.1, bottom: 0.1 }
        }
      });

      chartRef.current = chart;

      // ===== VELAS =====
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

      // ===== BANDAS ENVOLVENTES (máximos y mínimos) =====
      const bandaSuperior = chart.addLineSeries({
        color: '#2563eb',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceScaleId: 'right',
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      bandaSuperior.setData(velas.map((v) => ({ time: v.date, value: v.high })));

      const bandaInferior = chart.addLineSeries({
        color: '#9ca3af',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceScaleId: 'right',
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false
      });
      bandaInferior.setData(velas.map((v) => ({ time: v.date, value: v.low })));

      // ===== INDICADOR EQUATY =====
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
    }

    init();

    return () => cleanup();
  }, [velas, smis]);

  // ===== PRECEDENTES (días extra a la derecha) =====
  useEffect(() => {
    if (!chartRef.current || precedentes.length === 0 || !velas || velas.length === 0) return;

    const chart = chartRef.current;
    let seriesCreadas = [];

    (async () => {
      const { createChart, LineStyle } = await import('lightweight-charts');
      // lightweight-charts no exporta LineStyle en import dinámico de forma fiable
      // Usamos una serie de líneas con las fechas desplazadas
      // Crear fechas futuras a partir de la última vela
      const ultimaFecha = new Date(velas[velas.length - 1].date);
      const fechasExtra = [];
      for (let d = 1; d <= DIAS_EXTRA; d++) {
        const f = new Date(ultimaFecha);
        f.setDate(f.getDate() + d);
        fechasExtra.push(f.toISOString().slice(0, 10));
      }

      precedentes.forEach((p, idx) => {
        const opacidad = 0.15 + (idx / MAX_PRECEDENTES) * 0.25;

        // Línea superior del precedente
        const sup = chart.addLineSeries({
          color: `rgba(37, 99, 235, ${opacidad + 0.2})`,
          lineWidth: 1,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true
        });

        // Línea inferior del precedente
        const inf = chart.addLineSeries({
          color: `rgba(37, 99, 235, ${opacidad})`,
          lineWidth: 1,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true
        });

        sup.setData(p.dias.map((d, i) => ({ time: fechasExtra[i], value: d.high })));
        inf.setData(p.dias.map((d, i) => ({ time: fechasExtra[i], value: d.low })));

        seriesCreadas.push({ idx, sup, inf, precedente: p });
      });

      // Manejar hover: iluminar el precedente
      function handleCrosshair(param) {
        if (!param.point) {
          setHoverIdx(-1);
          setTooltip(null);
          return;
        }
        // Buscar qué precedente está bajo el ratón
        let hoverEncontrado = -1;
        for (const s of seriesCreadas) {
          const valSup = param.seriesData.get(s.sup);
          const valInf = param.seriesData.get(s.inf);
          if (valSup && valInf) {
            hoverEncontrado = s.idx;
            const fecha = s.precedente.fecha;
            const smi = s.precedente.smi;
            setHoverIdx(s.idx);
            setTooltip({
              fecha,
              smi,
              x: param.point.x,
              y: param.point.y
            });
            break;
          }
        }
        if (hoverEncontrado === -1) {
          setHoverIdx(-1);
          setTooltip(null);
        }
      }

      chart.subscribeCrosshairMove(handleCrosshair);
    })();

    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.unsubscribeCrosshairMove?.();
        } catch (e) {}
      }
    };
  }, [precedentes, velas]);

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico con precedentes (pruebas)</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Este gráfico muestra el precio de las últimas 60 sesiones con dos bandas envolventes
        (máximos y mínimos unidos por líneas) y, a la derecha, las bandas que se dieron la última
        vez que el indicador estuvo en un valor similar y con la misma pendiente.
        {precedentes.length === 0 && (
          <span style={{ display: 'block', marginTop: '6px', color: '#b91c1c' }}>
            No se ha encontrado ningún precedente con estas características.
          </span>
        )}
        {precedentes.length > 0 && (
          <span style={{ display: 'block', marginTop: '6px' }}>
            Se han encontrado {precedentes.length} precedentes.
          </span>
        )}
      </p>

      <div
        className="v3-card"
        style={{ padding: '12px', background: '#fff', position: 'relative' }}
      >
        <div ref={contenedorRef} style={{ width: '100%' }} />
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x + 12,
              top: tooltip.y + 12,
              background: 'rgba(17,17,17,0.92)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 10,
              lineHeight: 1.4,
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ fontWeight: 700 }}>Precedente del {tooltip.fecha}</div>
            <div style={{ opacity: 0.8 }}>Indicador: {tooltip.smi.toFixed(0)}</div>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        <strong>Leyenda:</strong> línea azul superior = máximos de cada vela. Línea gris inferior =
        mínimos de cada vela. Línea morada = indicador Equaty. Bandas azules a la derecha =
        precedentes (5 días siguientes al último día en el que el indicador estuvo en ±5 puntos del
        valor actual y con la misma pendiente).
      </p>
    </section>
  );
}
