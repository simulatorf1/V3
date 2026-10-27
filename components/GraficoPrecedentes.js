'use client';

import { useEffect, useRef, useState } from 'react';

const DIAS_EXTRA = 5;
const RANGO_VALOR = 30;
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

  // Recorremos TODO el histórico disponible hacia atrás.
  // Necesitamos que haya al menos 5 velas después del candidato.
  for (let i = idxActual - 1; i >= 0; i--) {
    // Si no hay suficientes velas después, no sirve
    if (i + DIAS_EXTRA >= velas.length) continue;

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

      // ===== PRECEDENTES (5 días extra a la derecha) =====
      if (precedentes.length > 0) {
        const ultimaFecha = new Date(velas[velas.length - 1].date);
        const fechasExtra = [];
        for (let d = 1; d <= DIAS_EXTRA; d++) {
          const f = new Date(ultimaFecha);
          f.setDate(f.getDate() + d);
          fechasExtra.push(f.toISOString().slice(0, 10));
        }

        const seriesPrecedentes = [];

        precedentes.forEach((p, idx) => {
          const opacidad = 0.15 + (idx / MAX_PRECEDENTES) * 0.25;

          const sup = chart.addLineSeries({
            color: `rgba(37, 99, 235, ${opacidad + 0.3})`,
            lineWidth: 2,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: true
          });
          const inf = chart.addLineSeries({
            color: `rgba(37, 99, 235, ${opacidad})`,
            lineWidth: 2,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: true
          });

          sup.setData(p.dias.map((d, i) => ({ time: fechasExtra[i], value: d.high })));
          inf.setData(p.dias.map((d, i) => ({ time: fechasExtra[i], value: d.low })));

          seriesPrecedentes.push({ idx, sup, inf, precedente: p });
        });

        chart.subscribeCrosshairMove((param) => {
          if (!param.point) {
            setTooltip(null);
            return;
          }
          let encontrado = null;
          for (const s of seriesPrecedentes) {
            const valSup = param.seriesData.get(s.sup);
            const valInf = param.seriesData.get(s.inf);
            if (valSup || valInf) {
              encontrado = s.precedente;
              break;
            }
          }
          if (encontrado) {
            setTooltip({
              fecha: encontrado.fecha,
              smi: encontrado.smi,
              x: param.point.x,
              y: param.point.y
            });
          } else {
            setTooltip(null);
          }
        });
      }

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
  }, [velas, smis, precedentes]);

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico con precedentes (pruebas)</h2>
      <p style={{ color: 'var(--v3-text-soft)', fontSize: '13px', marginTop: '-4px' }}>
        Velas de las últimas 60 sesiones con dos bandas envolventes (máximos y mínimos unidos por
        líneas) y, a la derecha, las bandas que se dieron la última vez que el indicador estuvo en
        un valor similar (±30 puntos) y con la misma pendiente.
        {precedentes.length === 0 && (
          <span style={{ display: 'block', marginTop: '6px', color: '#b91c1c' }}>
            No se ha encontrado ningún precedente con estas características.
          </span>
        )}
        {precedentes.length > 0 && (
          <span style={{ display: 'block', marginTop: '6px' }}>
            {precedentes.length} precedente{precedentes.length === 1 ? '' : 's'} encontrado
            {precedentes.length === 1 ? '' : 's'}.
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
        precedentes (5 días siguientes al último día en el que el indicador estuvo en ±30 puntos del
        valor actual y con la misma pendiente).
      </p>
    </section>
  );
}
