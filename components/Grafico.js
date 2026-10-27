'use client';

import { useEffect, useRef, useState } from 'react';

const DIAS_EXTRA = 10;
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

  let mejorCandidato = null;
  let mejorDistancia = Infinity;

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

    const distancia = Math.abs(v - smiActual);

    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;

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

      mejorCandidato = {
        fecha: velas[i].date,
        indexFecha: i,
        smi: v,
        distancia,
        dias
      };
    }
  }

  return mejorCandidato;
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

export default function Grafico({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const chartRef = useRef(null);
  const [precedente, setPrecedente] = useState(null);

  // Si no se pasa smiActual, usar el último valor de smis
  const smiFinal =
    smiActual !== null && smiActual !== undefined
      ? smiActual
      : smis && smis.length > 0
      ? smis[smis.length - 1]
      : null;

  useEffect(() => {
    if (!velas || velas.length === 0) return;
    setPrecedente(buscarPrecedente(velas, smis, smiFinal));
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
          height: 520,
          layout: { background: { color: '#ffffff' }, textColor: '#333' },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' }
          },
          timeScale: { borderColor: '#ddd', rightOffset: 20 },
          rightPriceScale: { borderColor: '#ddd', scaleMargins: { top: 0.1, bottom: 0.1 } },
          leftPriceScale: {
            borderColor: '#ddd',
            visible: true,
            scaleMargins: { top: 0.1, bottom: 0.1 }
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

        // Línea media en NARANJA
        const lineaMedia = chart.addLineSeries({
          color: '#ea580c',
          lineWidth: 3,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        lineaMedia.setData(lineaMediaData);

        if (precedente) {
          const fechasHistoricas = [];
          const highsHistoricos = [];
          const lowsHistoricos = [];

          const idxInicio = precedente.indexFecha;
          const idxFin = Math.min(idxInicio + DIAS_EXTRA, velas.length - 1);

          for (let j = idxInicio; j <= idxFin; j++) {
            fechasHistoricas.push(velas[j].date);
            highsHistoricos.push(velas[j].high);
            lowsHistoricos.push(velas[j].low);
          }

          const maxHistorico = Math.max(...highsHistoricos);
          const minHistorico = Math.min(...lowsHistoricos);

          const areaSupHistorica = chart.addAreaSeries({
            topColor: 'rgba(251, 191, 36, 0.18)',
            bottomColor: 'rgba(251, 191, 36, 0.05)',
            lineColor: 'rgba(251, 191, 36, 0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaSupHistorica.setData(
            fechasHistoricas.map((f) => ({ time: f, value: maxHistorico }))
          );

          const areaInfHistorica = chart.addAreaSeries({
            topColor: 'rgba(251, 191, 36, 0)',
            bottomColor: 'rgba(251, 191, 36, 0.18)',
            lineColor: 'rgba(251, 191, 36, 0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaInfHistorica.setData(
            fechasHistoricas.map((f) => ({ time: f, value: minHistorico }))
          );

          const lineaFuturaData = [{ time: ultimaVela.date, value: cierreActual }];
          let medioAcum = cierreActual;

          for (let i = 0; i < precedente.dias.length; i++) {
            const d = precedente.dias[i];
            const fechaFutura = sumarDiasHabiles(ultimaVela.date, i + 1);
            medioAcum += d.deltaMedio;
            lineaFuturaData.push({ time: fechaFutura, value: medioAcum });
          }

          const areaRecuadro = chart.addAreaSeries({
            topColor: 'rgba(251, 191, 36, 0.15)',
            bottomColor: 'rgba(251, 191, 36, 0.15)',
            lineColor: 'rgba(251, 191, 36, 0)',
            lineWidth: 1,
            priceScaleId: 'right',
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
          });
          areaRecuadro.setData(
            lineaFuturaData.map((p) => ({ time: p.time, value: p.value }))
          );

          const lineaFutura = chart.addLineSeries({
            color: 'rgba(234, 88, 12, 0.9)',
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
            color: 'rgba(251, 191, 36, 0.6)',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: 'réplica histórica',
            priceScaleId: 'right'
          });
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
            cerró por debajo.
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            La línea naranja es la media del precio de cada vela. La zona amarilla del histórico
            marca los días que se están replicando. La línea naranja discontinua a la derecha es la
            proyección a 10 sesiones.
          </p>
          <p style={{ margin: 0 }}>
            La etiqueta "réplica histórica" indica que la zona derecha no es una predicción, sino
            una copia de lo que pasó la última vez que el indicador estuvo en una situación
            similar. Este gráfico representa exclusivamente información histórica ya ocurrida. No
            identifica oportunidades de inversión, no anticipa movimientos futuros y no constituye
            recomendación de inversión.
          </p>
        </div>
      </details>

      <div className="v3-card" style={{ padding: '12px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%' }} />
      </div>
    </section>
  );
}
