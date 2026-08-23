import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";

import type { Candle } from "@/lib/xnova/types";

function movingAverage(candles: Candle[], period: number) {
  const out: { time: UTCTimestamp; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i]!.close;
    if (i >= period) sum -= candles[i - period]!.close;
    if (i >= period - 1) out.push({ time: candles[i]!.time as UTCTimestamp, value: sum / period });
  }
  return out;
}

export function CandleCanvas({ candles, showMa }: { candles: Candle[]; showMa: boolean }) {
  const container = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<{
    candle: ReturnType<IChartApi["addSeries"]> | null;
    volume: ReturnType<IChartApi["addSeries"]> | null;
    ma7: ReturnType<IChartApi["addSeries"]> | null;
    ma25: ReturnType<IChartApi["addSeries"]> | null;
  }>({ candle: null, volume: null, ma7: null, ma25: null });

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { color: "transparent" },
        textColor: "#8b8b93",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(255,70,60,0.5)", labelBackgroundColor: "#8c1a1a" },
        horzLine: { color: "rgba(255,70,60,0.5)", labelBackgroundColor: "#8c1a1a" },
      },
      handleScroll: true,
      handleScale: true,
      autoSize: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#2fd48a",
      downColor: "#f0483e",
      borderUpColor: "#2fd48a",
      borderDownColor: "#f0483e",
      wickUpColor: "#2fd48a",
      wickDownColor: "#f0483e",
      priceFormat: { type: "price", precision: 8, minMove: 0.00000001 },
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    const ma7 = chart.addSeries(LineSeries, { color: "#f0b429", lineWidth: 1 });
    const ma25 = chart.addSeries(LineSeries, { color: "#4aa8ff", lineWidth: 1 });

    seriesRef.current = { candle: candleSeries, volume: volumeSeries, ma7, ma25 };

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = { candle: null, volume: null, ma7: null, ma25: null };
    };
  }, []);

  useEffect(() => {
    const { candle, volume, ma7, ma25 } = seriesRef.current;
    if (!candle || !volume || !ma7 || !ma25) return;
    candle.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volume.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(47,212,138,0.35)" : "rgba(240,72,62,0.35)",
      })),
    );
    ma7.setData(showMa ? movingAverage(candles, 7) : []);
    ma25.setData(showMa ? movingAverage(candles, 25) : []);
  }, [candles, showMa]);

  return <div ref={container} className="h-full w-full" />;
}
