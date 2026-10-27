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

        // Velas reales
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

        // Línea media del histórico
        const lineaMediaData = velas.map((v) => ({
          time: v.date,
          value: (v.high + v.low) / 2
        }));

        const lineaMedia = chart.addLineSeries({
          color: '#2563eb',
          lineWidth: 3,
          priceScaleId: 'right',
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false
        });
        lineaMedia.setData(lineaMediaData);

        // Si hay precedente, colorear la zona histórica y dibujar la proyección
        if (precedente) {
          // ========== ZONA HISTÓRICA COLOREADA ==========
          // Extraer las fechas y high/low de los días del precedente
          const fechasHistoricas = [];
          const highsHistoricos = [];
          const lowsHistoricos = [];

          // El precedente empieza en el día del precedente (indexFecha) y dura DIAS_EXTRA+1 días
          const idxInicio = precedente.indexFecha;
          const idxFin = Math.min(idxInicio + DIAS_EXTRA, velas.length - 1);

          for (let j = idxInicio; j <= idxFin; j++) {
            fechasHistoricas.push(velas[j].date);
            highsHistoricos.push(velas[j].high);
            lowsHistoricos.push(velas[j].low);
          }

          // Calcular el máximo y mínimo de la zona histórica
          const maxHistorico = Math.max(...highsHistoricos);
          const minHistorico = Math.min(...lowsHistoricos);

          // Serie de área para el relleno superior (desde el máximo hasta el suelo)
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

          // Serie de área invertida para el relleno inferior (desde el mínimo hasta el techo)
          // lightweight-charts no permite rellenar hacia arriba, así que usamos una serie
          // de área con el mínimo y bottomColor transparente, y topColor con el color del relleno
          // No queda perfecto, pero simula la banda
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

          // ========== PROYECCIÓN FUTURA ==========
          const lineaFuturaData = [{ time: ultimaVela.date, value: cierreActual }];
          let medioAcum = cierreActual;

          for (let i = 0; i < precedente.dias.length; i++) {
            const d = precedente.dias[i];
            const fechaFutura = sumarDiasHabiles(ultimaVela.date, i + 1);
            medioAcum += d.deltaMedio;
            lineaFuturaData.push({ time: fechaFutura, value: medioAcum });
          }

          // Área amarilla de la proyección
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
            color: 'rgba(37, 99, 235, 0.9)',
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
      <h2 className="v3-seccion-titulo">Gráfico con proyección (pruebas)</h2>

      <div className="v3-card" style={{ padding: '12px', background: '#fff' }}>
        <div ref={contenedorRef} style={{ width: '100%', height: '520px' }} />
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        La línea azul fuerte sobre las velas es la media del precio de cada vela. La zona amarilla
        del histórico marca los días que se están replicando. La línea azul discontinua a la
        derecha es la proyección a 10 <strong>sesiones</strong> (días hábiles, sin contar sábados ni
        domingos). La etiqueta <strong>"réplica histórica"</strong> indica que la zona derecha no es
        una predicción, sino una copia de lo que pasó en la zona amarilla del histórico.
        {precedente && (
          <span style={{ display: 'block', marginTop: '4px' }}>
            Precedente: {precedente.fecha} · Indicador: {precedente.smi.toFixed(0)} · Distancia al valor actual:{' '}
            {precedente.distancia.toFixed(1)} puntos
          </span>
        )}
      </p>
    </section>
  );
}
