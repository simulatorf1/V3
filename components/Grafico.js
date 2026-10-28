'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const VELAS_ATRAS = 30;
const DIAS_EXTRA = 10;
const RANGO_VALOR = 30;
const MAX_REPLICAS = 5;

// Pendiente inmediata: diferencia con el día anterior
function calcularPendiente(smis, idx) {
  if (idx < 1) return null;
  const actual = smis[idx];
  const anterior = smis[idx - 1];
  if (actual === null || actual === undefined || anterior === null || anterior === undefined) {
    return null;
  }
  return actual - anterior;
}

function buscarReplicas(velas, smis, smiActual) {
  if (!velas || !smis || velas.length < 10 || smis.length < 10) return [];
  if (smiActual === null || smiActual === undefined) return [];

  const idxActual = smis.length - 1;
  const pendienteActual = calcularPendiente(smis, idxActual);

  const candidatos = [];

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
      const medio = (vela.high + vela.low) / 2;
      const medioAnterior = (velaAnterior.high + velaAnterior.low) / 2;
      dias.push({
        date: vela.date,
        deltaMedio: medio - medioAnterior,
        high: vela.high,
        low: vela.low
      });
    }

    candidatos.push({
      fecha: velas[i].date,
      fechaFin: velas[Math.min(i + DIAS_EXTRA, velas.length - 1)].date,
      indexFecha: i,
      smi: v,
      distancia: Math.abs(v - smiActual),
      dias
    });
  }

  return candidatos
    .sort((a, b) => a.distancia - b.distancia)
    .slice(0, MAX_REPLICAS);
}

function sumarDiasHabiles(fechaStr, dias) {
  const f = new Date(fechaStr + 'T00:00:00');
  let contados = 0;
  while (contados < dias) {
    f.setDate(f.getDate() + 1);
    const diaSemana = f.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      contados++;
    }
  }
  return f.toISOString().slice(0, 10);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr + 'T00:00:00');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()}-${meses[d.getMonth()]}`;
  } catch (e) {
    return '';
  }
}

const COLORES_REPLICAS = [
  { fondo: 'rgba(251, 191, 36, 0.18)', borde: 'rgba(251, 191, 36, 0.6)', linea: 'rgba(234, 88, 12, 0.9)' },
  { fondo: 'rgba(59, 130, 246, 0.18)', borde: 'rgba(59, 130, 246, 0.6)', linea: 'rgba(37, 99, 235, 0.9)' },
  { fondo: 'rgba(16, 185, 129, 0.18)', borde: 'rgba(16, 185, 129, 0.6)', linea: 'rgba(5, 150, 105, 0.9)' },
  { fondo: 'rgba(168, 85, 247, 0.18)', borde: 'rgba(168, 85, 247, 0.6)', linea: 'rgba(147, 51, 234, 0.9)' },
  { fondo: 'rgba(239, 68, 68, 0.18)', borde: 'rgba(239, 68, 68, 0.6)', linea: 'rgba(220, 38, 38, 0.9)' }
];

export default function Grafico({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const chartRef = useRef(null);
  const [replicas, setReplicas] = useState([]);
  const [indiceReplica, setIndiceReplica] = useState(0);

  const smiFinal =
    smiActual !== null && smiActual !== undefined
      ? smiActual
      : smis && smis.length > 0
      ? smis[smis.length - 1]
      : null;

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    const encontradas = buscarReplicas(velas, smis, smiFinal);
    setReplicas(encontradas);
    setIndiceReplica(0);
  }, [velas, smis, smiFinal]);

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
          height: 420,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#666',
            fontSize: 10,
            fontFamily: 'sans-serif'
          },
          grid: {
            vertLines: { color: '#f5f5f5' },
            horzLines: { color: '#f5f5f5' }
          },
          timeScale: {
            borderColor: '#e5e7eb',
            rightOffset: 0,
            barSpacing: 4,
            minBarSpacing: 1
          },
          rightPriceScale: {
            borderColor: '#e5e7eb',
            scaleMargins: { top: 0, bottom: 0 }
          },
          leftPriceScale: {
            borderColor: '#e5e7eb',
            visible: true,
            scaleMargins: { top: 0, bottom: 0 }
          }
        });

        chartRef.current = chart;

        const ultimaVela = velas[velas.length - 1];
        const cierreActual = ultimaVela.close;

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

        const lineaMediaData = velas.map((v) => ({
          time: v.date,
          value: (v.high + v.low) / 2
        }));

        const lineaMedia = chart.addLineSeries({
          color: '#ea580c',
          lineWidth: 1.5,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        lineaMedia.setData(lineaMediaData);

        chart._replicaSeries = {
          areaSup: null,
          areaInf: null,
          areaFutura: null,
          lineaFutura: null
        };

        chart._dibujarReplica = (replica, color) => {
          if (chart._replicaSeries.areaSup) {
            try { chart.removeSeries(chart._replicaSeries.areaSup); } catch (e) {}
          }
          if (chart._replicaSeries.areaInf) {
            try { chart.removeSeries(chart._replicaSeries.areaInf); } catch (e) {}
          }
          if (chart._replicaSeries.areaFutura) {
            try { chart.removeSeries(chart._replicaSeries.areaFutura); } catch (e) {}
          }
          if (chart._replicaSeries.lineaFutura) {
            try { chart.removeSeries(chart._replicaSeries.lineaFutura); } catch (e) {}
          }

          if (!replica) return;

          const fechasHistoricas = [];
          const highsHistoricos = [];
          const lowsHistoricos = [];

          const idxInicio = replica.indexFecha;
          const idxFin = Math.min(idxInicio + DIAS_EXTRA, velas.length - 1);

          for (let j = idxInicio; j <= idxFin; j++) {
            fechasHistoricas.push(velas[j].date);
            highsHistoricos.push(velas[j].high);
            lowsHistoricos.push(velas[j].low);
          }

          const maxHistorico = Math.max(...highsHistoricos);
          const minHistorico = Math.min(...lowsHistoricos);

          const areaSup = chart.addAreaSeries({
            topColor: color.fondo,
            bottomColor: 'rgba(0,0,0,0)',
            lineColor: 'rgba(0,0,0,0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaSup.setData(fechasHistoricas.map((f) => ({ time: f, value: maxHistorico })));

          const areaInf = chart.addAreaSeries({
            topColor: 'rgba(0,0,0,0)',
            bottomColor: color.fondo,
            lineColor: 'rgba(0,0,0,0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaInf.setData(fechasHistoricas.map((f) => ({ time: f, value: minHistorico })));

          const lineaFuturaData = [{ time: ultimaVela.date, value: cierreActual }];
          let medioAcum = cierreActual;

          for (let i = 0; i < replica.dias.length; i++) {
            const d = replica.dias[i];
            const fechaFutura = sumarDiasHabiles(ultimaVela.date, i + 1);
            medioAcum += d.deltaMedio;
            lineaFuturaData.push({ time: fechaFutura, value: medioAcum });
          }

          const areaFutura = chart.addAreaSeries({
            topColor: color.fondo,
            bottomColor: color.fondo,
            lineColor: 'rgba(0,0,0,0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaFutura.setData(lineaFuturaData.map((p) => ({ time: p.time, value: p.value })));

          const lineaFutura = chart.addLineSeries({
            color: color.linea,
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: true
          });
          lineaFutura.setData(lineaFuturaData);

          lineaFutura.createPriceLine({
            price: lineaFuturaData[lineaFuturaData.length - 1].value,
            color: color.borde,
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `réplica ${formatearFecha(replica.fecha)} → ${formatearFecha(replica.fechaFin)}`,
            priceScaleId: 'right'
          });

          chart._replicaSeries = {
            areaSup,
            areaInf,
            areaFutura,
            lineaFutura
          };
        };

        if (replicas.length > 0) {
          chart._dibujarReplica(replicas[0], COLORES_REPLICAS[0]);
        }

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
          scaleMargins: { top: 0, bottom: 0 }
        });
        smiLine.applyOptions({
          autoscaleInfoProvider: () => ({
            priceRange: { minValue: -100, maxValue: 100 }
          })
        });

        const totalVelas = velas.length;
        const desde = Math.max(0, totalVelas - 1 - VELAS_ATRAS);
        const hasta = totalVelas + DIAS_EXTRA;
        try {
          chart.timeScale().setVisibleLogicalRange({ from: desde, to: hasta });
        } catch (e) {
          chart.timeScale().fitContent();
        }

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
  }, [velas, smis, replicas]);

  const cambiarReplica = useCallback(
    (idx) => {
      if (!chartRef.current || !replicas[idx]) return;
      setIndiceReplica(idx);
      chartRef.current._dibujarReplica(replicas[idx], COLORES_REPLICAS[idx % COLORES_REPLICAS.length]);
    },
    [replicas]
  );

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico principal (diario)</h2>

      <details
        style={{
          marginBottom: '8px',
          fontSize: '13px',
          color: 'var(--v3-text-soft)'
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          Cómo leer este gráfico
        </summary>
        <div style={{ paddingTop: '8px', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 6px 0' }}>
            Cada vela representa una sesión: azul si cerró por encima de su apertura, gris si
            cerró por debajo. La línea naranja es la media del precio de cada vela.
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            La zona coloreada del histórico marca los días que se están replicando. La línea
            discontinua a la derecha es la proyección a 10 sesiones.
          </p>
          <p style={{ margin: 0 }}>
            La etiqueta indica las fechas del precedente que se está replicando. Puedes cambiar
            entre varias réplicas con los botones de arriba. Esto no es una predicción: es una
            copia de lo que pasó en situaciones similares. No constituye recomendación de
            inversión.
          </p>
        </div>
      </details>

      {replicas.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}
        >
          {replicas.map((r, idx) => (
            <button
              key={r.fecha}
              onClick={() => cambiarReplica(idx)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '999px',
                border:
                  idx === indiceReplica
                    ? '2px solid ' + COLORES_REPLICAS[idx % COLORES_REPLICAS.length].linea
                    : '1px solid var(--v3-border)',
                background:
                  idx === indiceReplica
                    ? COLORES_REPLICAS[idx % COLORES_REPLICAS.length].fondo
                    : '#fff',
                color: 'var(--v3-text)',
                cursor: 'pointer'
              }}
            >
              Réplica {idx + 1} · {formatearFecha(r.fecha)}
            </button>
          ))}
        </div>
      )}

      <div className="v3-card" style={{ padding: '4px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%' }} />
      </div>
    </section>
  );
}
