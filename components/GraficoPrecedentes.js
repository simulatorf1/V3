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
          low: vela.low,
          open: vela.open,
          close: vela.close
        });
      }

      mejorCandidato = {
        fecha: velas[i].date,
        smi: v,
        distancia,
        dias
      };
    }
  }

  return mejorCandidato;
}

function sumarDias(fechaStr, dias) {
  const f = new Date(fechaStr + 'T00:00:00');
  f.setDate(f.getDate() + dias);
  return f.toISOString().slice(0, 10);
}

export default function GraficoPrecedentes({ velas, smis, smiActual }) {
  const contenedorRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const velasSeriesRef = useRef(null);
  const [precedente, setPrecedente] = useState(null);
  const [chartListo, setChartListo] = useState(false);

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
    velasSeriesRef.current = null;

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
        velasSeriesRef.current = velasSeries;

        // Línea central del histórico: media de cada vela (más gruesa y visible)
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

        // Línea central futura
        if (precedente) {
          const lineaFuturaData = [{ time: ultimaVela.date, value: cierreActual }];
          let medioAcum = cierreActual;

          for (let i = 0; i < precedente.dias.length; i++) {
            const d = precedente.dias[i];
            const fechaFutura = sumarDias(ultimaVela.date, i + 1);
            medioAcum += d.deltaMedio;
            lineaFuturaData.push({ time: fechaFutura, value: medioAcum });
          }

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
          setTimeout(dibujarOverlay, 100);
        }
        window.addEventListener('resize', handleResize);

        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          if (chart) chart.remove();
          chartRef.current = null;
          velasSeriesRef.current = null;
        };

        setTimeout(() => {
          if (!cancelado) setChartListo(true);
        }, 800);
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

  useEffect(() => {
    if (!chartListo) return;
    if (!precedente) return;
    if (!velas || velas.length < 2) return;
    if (!contenedorRef.current || !overlayRef.current) return;
    if (!chartRef.current) return;
    if (!velasSeriesRef.current) return;

    const chart = chartRef.current;
    const timeScale = chart.timeScale();

    const redibujar = () => {
      dibujarOverlay();
    };

    const timer = setTimeout(redibujar, 200);
    timeScale.subscribeVisibleLogicalRangeChange(redibujar);

    return () => {
      clearTimeout(timer);
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(redibujar);
      } catch (e) {}
    };
  }, [chartListo, precedente, velas]);

  function dibujarOverlay() {
    try {
      const contenedor = contenedorRef.current;
      const overlay = overlayRef.current;
      const chart = chartRef.current;
      const serie = velasSeriesRef.current;
      if (!contenedor || !overlay || !chart || !serie) return;
      if (!precedente) return;
      if (!velas || velas.length < 2) return;

      const width = contenedor.clientWidth;
      const height = contenedor.clientHeight;
      if (width === 0 || height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      overlay.width = width * dpr;
      overlay.height = height * dpr;
      overlay.style.width = width + 'px';
      overlay.style.height = height + 'px';

      const ctx = overlay.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const timeScale = chart.timeScale();

      const ultimaVela = velas[velas.length - 1];
      const cierreActual = ultimaVela.close;

      // Coordenada X de la última vela
      const ultimoIndiceLogico = velas.length - 1;
      const xUltima = timeScale.logicalToCoordinate(ultimoIndiceLogico);
      const xAnterior = timeScale.logicalToCoordinate(ultimoIndiceLogico - 1);
      if (xUltima === null || xUltima === undefined) return;
      if (xAnterior === null || xAnterior === undefined) return;

      const anchoUnidadLogica = xUltima - xAnterior;
      if (anchoUnidadLogica <= 0) return;

      // Calcular precios medios futuros acumulados
      const mediosFuturos = [cierreActual];
      let medioAcum = cierreActual;
      for (let i = 0; i < precedente.dias.length; i++) {
        medioAcum += precedente.dias[i].deltaMedio;
        mediosFuturos.push(medioAcum);
      }

      // Recuadro de la zona replicada
      const xInicio = xUltima;
      const xFin = xUltima + precedente.dias.length * anchoUnidadLogica;

      // Calcular Y min y max de la zona replicada (usando las velas del precedente ajustadas)
      let yMin = Infinity;
      let yMax = -Infinity;

      for (let i = 0; i < precedente.dias.length; i++) {
        const d = precedente.dias[i];
        const mean = mediosFuturos[i + 1];
        const prevMean = mediosFuturos[i];
        // Para el alto/bajo de la vela: usamos la diferencia entre high/low del precedente
        // respecto a su media, aplicada a la media futura
        const meanPrec = (d.high + d.low) / 2;
        const highAjustado = mean + (d.high - meanPrec);
        const lowAjustado = mean + (d.low - meanPrec);

        const yHigh = serie.priceToCoordinate(highAjustado);
        const yLow = serie.priceToCoordinate(lowAjustado);
        if (yHigh !== null && yHigh !== undefined) {
          yMin = Math.min(yMin, yHigh);
          yMax = Math.max(yMax, yHigh);
        }
        if (yLow !== null && yLow !== undefined) {
          yMin = Math.min(yMin, yLow);
          yMax = Math.max(yMax, yLow);
        }
      }

      // Añadir margen al recuadro
      const margenRecuadro = 20;
      if (yMin !== Infinity && yMax !== -Infinity) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
        ctx.fillRect(xInicio, yMin - margenRecuadro, xFin - xInicio, yMax - yMin + margenRecuadro * 2);

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(xInicio, yMin - margenRecuadro, xFin - xInicio, yMax - yMin + margenRecuadro * 2);
        ctx.setLineDash([]);
      }

      // Velas punteadas centradas en la línea media futura
      for (let i = 0; i < precedente.dias.length; i++) {
        const d = precedente.dias[i];
        const x = xUltima + (i + 1) * anchoUnidadLogica;
        const mean = mediosFuturos[i + 1];

        // Calcular high y low ajustados: el rango de la vela del precedente,
        // centrado en la media futura
        const meanPrec = (d.high + d.low) / 2;
        const highAjustado = mean + (d.high - meanPrec);
        const lowAjustado = mean + (d.low - meanPrec);

        const yHigh = serie.priceToCoordinate(highAjustado);
        const yLow = serie.priceToCoordinate(lowAjustado);
        const yMean = serie.priceToCoordinate(mean);

        if (yHigh === null || yHigh === undefined) continue;
        if (yLow === null || yLow === undefined) continue;

        // Dibujar vela punteada: mecha (línea vertical) + cuerpo (línea horizontal corta)
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        // Mecha
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Cuerpo (línea horizontal en la media)
        const anchoCuerpo = anchoUnidadLogica * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - anchoCuerpo / 2, yMean);
        ctx.lineTo(x + anchoCuerpo / 2, yMean);
        ctx.stroke();

        ctx.setLineDash([]);
      }
    } catch (e) {
      console.error('Error dibujando overlay:', e);
    }
  }

  return (
    <section className="v3-seccion">
      <h2 className="v3-seccion-titulo">Gráfico con proyección (pruebas)</h2>

      <div
        className="v3-card"
        style={{ padding: '12px', background: '#fff', position: 'relative' }}
      >
        <div ref={contenedorRef} style={{ width: '100%', height: '520px' }} />
        <canvas
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />
      </div>

      <p style={{ color: 'var(--v3-text-mute)', fontSize: '12px', marginTop: '8px' }}>
        La línea azul fuerte sobre las velas es la media del precio de cada vela. La línea azul
        discontinua a la derecha es la proyección a 10 días de esa media. El recuadro amarillo
        marca la zona que se está replicando (no es una predicción, es una copia de lo que pasó la
        última vez que el indicador estuvo en una situación similar). Las velas punteadas son las
        velas del precedente, centradas en la media futura.
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
