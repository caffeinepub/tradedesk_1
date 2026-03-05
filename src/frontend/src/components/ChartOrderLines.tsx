import { formatCurrency } from "@/utils/format";
import { Square, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export interface ActiveOrderLines {
  symbol: string;
  side: "buy" | "sell";
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingSL?: { distance: number; type: "percent" | "points" } | null;
}

interface ChartOrderLinesProps {
  lines: ActiveOrderLines;
  visiblePriceHigh: number;
  visiblePriceLow: number;
  chartHeightPx: number;
  onDismiss: () => void;
  currentPrice?: number;
}

function priceToY(
  price: number,
  high: number,
  low: number,
  heightPx: number,
): number {
  const range = high - low;
  if (range === 0) return heightPx / 2;
  return ((high - price) / range) * heightPx;
}

interface LineDef {
  price: number;
  label: string;
  pnl: string | null;
  color: string;
  borderStyle: "solid" | "dashed";
  labelBg: string;
  labelText: string;
  isEntry?: boolean;
}

type SimSpeed = "slow" | "normal" | "fast";

interface SpeedConfig {
  label: string;
  intervalMs: number;
  minPct: number;
  maxPct: number;
}

const SPEED_CONFIGS: Record<SimSpeed, SpeedConfig> = {
  slow: { label: "Slow", intervalMs: 1200, minPct: 0.0003, maxPct: 0.0008 },
  normal: { label: "Normal", intervalMs: 500, minPct: 0.0005, maxPct: 0.0018 },
  fast: { label: "Fast", intervalMs: 180, minPct: 0.0008, maxPct: 0.0022 },
};

const MAX_TICKS = 24;
const SIM_START_DELAY_MS = 1500;

function computeTrailSL(
  price: number,
  distance: number,
  type: "percent" | "points",
  side: "buy" | "sell",
): number {
  if (type === "percent") {
    return side === "buy"
      ? price * (1 - distance / 100)
      : price * (1 + distance / 100);
  }
  return side === "buy" ? price - distance : price + distance;
}

export function ChartOrderLines({
  lines,
  visiblePriceHigh,
  visiblePriceLow,
  chartHeightPx,
  onDismiss,
  currentPrice,
}: ChartOrderLinesProps) {
  const { entryPrice, stopLoss, takeProfit, side, trailingSL } = lines;

  // ── Simulation state ──────────────────────────────────────────────────────
  const baseline = currentPrice ?? entryPrice;
  const [simPrice, setSimPrice] = useState(baseline);
  const [simTrailSL, setSimTrailSL] = useState<number | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simFinished, setSimFinished] = useState(false);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>("normal");
  const tickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep latest simPrice in a ref so the interval closure always sees fresh value
  const simPriceRef = useRef(baseline);
  // Keep latest speed config in a ref so interval closure sees fresh value
  const speedRef = useRef<SimSpeed>("normal");

  // Reset simulation when the lines prop changes (new order placed)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional full reset
  useEffect(() => {
    const fresh = currentPrice ?? entryPrice;
    simPriceRef.current = fresh;
    setSimPrice(fresh);
    setSimTrailSL(null);
    setSimRunning(false);
    setSimFinished(false);
    setSimSpeed("normal");
    speedRef.current = "normal";
    tickRef.current = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lines]);

  // Sync speedRef when simSpeed changes
  useEffect(() => {
    speedRef.current = simSpeed;
  }, [simSpeed]);

  // Helper: start the tick interval at current speed
  const startInterval = (
    trailDist: number,
    trailType: "percent" | "points",
    trailSide: "buy" | "sell",
  ) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const cfg = SPEED_CONFIGS[speedRef.current];
    intervalRef.current = setInterval(() => {
      tickRef.current += 1;

      const { minPct, maxPct } = SPEED_CONFIGS[speedRef.current];
      const pctGain = minPct + Math.random() * (maxPct - minPct);
      const noise = (Math.random() - 0.3) * minPct * 0.4; // slight downward bias
      const multiplier = 1 + pctGain + noise;

      simPriceRef.current = simPriceRef.current * multiplier;
      const newPrice = simPriceRef.current;
      const newSL = computeTrailSL(newPrice, trailDist, trailType, trailSide);

      setSimPrice(newPrice);
      setSimTrailSL(newSL);

      if (tickRef.current >= MAX_TICKS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSimRunning(false);
        setSimFinished(true);
      }
    }, cfg.intervalMs);
  };

  // Start sim when trailingSL becomes non-null
  // biome-ignore lint/correctness/useExhaustiveDependencies: startInterval is stable (uses refs internally)
  useEffect(() => {
    if (!trailingSL) return;
    if (simFinished || simRunning) return;

    timeoutRef.current = setTimeout(() => {
      setSimRunning(true);
      startInterval(trailingSL.distance, trailingSL.type, side);
    }, SIM_START_DELAY_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [trailingSL, side, simFinished, simRunning]);

  const stopSim = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSimRunning(false);
    setSimFinished(true);
  };

  // Change speed mid-simulation: restart interval immediately
  const handleSpeedChange = (newSpeed: SimSpeed) => {
    setSimSpeed(newSpeed);
    speedRef.current = newSpeed;
    if (simRunning && trailingSL) {
      startInterval(trailingSL.distance, trailingSL.type, side);
    }
  };

  // ── Build static line defs ────────────────────────────────────────────────
  const lineDefs: LineDef[] = [];

  // Entry line
  lineDefs.push({
    price: entryPrice,
    label: `${side.toUpperCase()} ${lines.symbol}`,
    pnl: null,
    color: side === "buy" ? "oklch(0.72 0.18 145)" : "oklch(0.72 0.18 15)",
    borderStyle: "solid",
    labelBg: side === "buy" ? "oklch(0.18 0.07 145)" : "oklch(0.18 0.07 15)",
    labelText: side === "buy" ? "oklch(0.72 0.18 145)" : "oklch(0.72 0.18 15)",
    isEntry: true,
  });

  // Stop Loss line (fixed or trailing — static rendering only when sim is off)
  const showStaticSL =
    stopLoss !== null && !(trailingSL && (simRunning || simFinished));
  if (showStaticSL) {
    if (trailingSL) {
      const trailAnnotation =
        trailingSL.type === "percent"
          ? `-${trailingSL.distance}%`
          : `-${trailingSL.distance}pts`;
      lineDefs.push({
        price: stopLoss,
        label: "Trail SL",
        pnl: `trail: ${trailAnnotation}`,
        color: "oklch(0.72 0.18 55)",
        borderStyle: "dashed",
        labelBg: "oklch(0.18 0.07 55)",
        labelText: "oklch(0.72 0.18 55)",
      });
    } else {
      const slPnl = Math.abs(stopLoss - entryPrice);
      lineDefs.push({
        price: stopLoss,
        label: "SL",
        pnl: `−${formatCurrency(slPnl)}/unit`,
        color: "oklch(0.65 0.22 15)",
        borderStyle: "dashed",
        labelBg: "oklch(0.14 0.07 15)",
        labelText: "oklch(0.72 0.22 15)",
      });
    }
  }

  // Take Profit line
  if (takeProfit !== null) {
    const tpDist = Math.abs(takeProfit - entryPrice);
    lineDefs.push({
      price: takeProfit,
      label: "TP",
      pnl: `+${formatCurrency(tpDist)}/unit`,
      color: "oklch(0.65 0.20 145)",
      borderStyle: "dashed",
      labelBg: "oklch(0.14 0.07 145)",
      labelText: "oklch(0.72 0.20 145)",
    });
  }

  // ── Derived Y positions for simulation lines ──────────────────────────────
  const simActive = trailingSL && (simRunning || simFinished);
  const effectiveSimTrailSL =
    simTrailSL ??
    (trailingSL && stopLoss !== null
      ? computeTrailSL(baseline, trailingSL.distance, trailingSL.type, side)
      : null);

  const simPriceY =
    simActive && simRunning
      ? priceToY(simPrice, visiblePriceHigh, visiblePriceLow, chartHeightPx)
      : null;
  const simTrailSLY =
    simActive && effectiveSimTrailSL !== null
      ? priceToY(
          effectiveSimTrailSL,
          visiblePriceHigh,
          visiblePriceLow,
          chartHeightPx,
        )
      : null;

  const trailAnnotation = trailingSL
    ? trailingSL.type === "percent"
      ? `-${trailingSL.distance}%`
      : `-${trailingSL.distance}pts`
    : "";

  return (
    <motion.div
      data-ocid="chart.order_lines.panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      {/* ── Static lines ──────────────────────────────────────────────────── */}
      {lineDefs.map((lineDef) => {
        const y = priceToY(
          lineDef.price,
          visiblePriceHigh,
          visiblePriceLow,
          chartHeightPx,
        );
        const isVisible = y >= -20 && y <= chartHeightPx + 20;
        if (!isVisible) return null;

        return (
          <div
            key={lineDef.label}
            className="absolute left-0 right-0"
            style={{ top: `${y}px` }}
          >
            {/* Horizontal line */}
            <div
              className="absolute left-0 right-0"
              style={{
                height: "1px",
                background:
                  lineDef.borderStyle === "solid"
                    ? `oklch(${lineDef.color.replace("oklch(", "").replace(")", "")})`
                    : "none",
                borderTop:
                  lineDef.borderStyle === "dashed"
                    ? `1px dashed ${lineDef.color}`
                    : "none",
                borderTopColor:
                  lineDef.borderStyle === "dashed" ? undefined : lineDef.color,
                opacity: 0.75,
              }}
            />

            {/* Right-side label pill */}
            <div
              className="absolute right-2 -translate-y-1/2 flex items-center gap-1"
              style={{ pointerEvents: lineDef.isEntry ? "auto" : "none" }}
            >
              <div
                className="flex items-center gap-1.5 rounded px-1.5 py-0.5 border"
                style={{
                  background: lineDef.labelBg,
                  borderColor: lineDef.color,
                  opacity: 0.92,
                }}
              >
                <span
                  className="text-[10px] font-mono font-bold tabular-nums leading-none"
                  style={{ color: lineDef.labelText }}
                >
                  {lineDef.label}
                </span>
                <span
                  className="text-[10px] font-mono tabular-nums leading-none"
                  style={{ color: lineDef.labelText, opacity: 0.85 }}
                >
                  {formatCurrency(lineDef.price)}
                </span>
                {lineDef.pnl && (
                  <span
                    className="text-[9px] font-mono leading-none opacity-70"
                    style={{ color: lineDef.labelText }}
                  >
                    {lineDef.pnl}
                  </span>
                )}
                {lineDef.isEntry && (
                  <button
                    type="button"
                    data-ocid="chart.order_lines.close_button"
                    onClick={onDismiss}
                    className="ml-0.5 rounded-sm hover:opacity-100 transition-opacity"
                    style={{
                      pointerEvents: "auto",
                      color: lineDef.labelText,
                      opacity: 0.7,
                    }}
                    title="Dismiss order lines"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Left-side price marker */}
            <div
              className="absolute left-0 -translate-y-1/2"
              style={{ pointerEvents: "none" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full ml-1"
                style={{
                  background: lineDef.color,
                  opacity: 0.9,
                  boxShadow: `0 0 4px ${lineDef.color}`,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* ── Simulation: animated Trail SL line ───────────────────────────── */}
      {simActive && effectiveSimTrailSL !== null && simTrailSLY !== null && (
        <motion.div
          className="absolute left-0 right-0"
          animate={{ top: `${simTrailSLY}px` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ pointerEvents: "none" }}
        >
          {/* Dashed amber line */}
          <div
            className="absolute left-0 right-0"
            style={{
              height: "1px",
              borderTop: "1.5px dashed oklch(0.72 0.18 55)",
              opacity: 0.9,
            }}
          />
          {/* Right label pill with live price + stop button */}
          <div
            className="absolute right-2 -translate-y-1/2 flex items-center gap-1"
            style={{ pointerEvents: "auto" }}
          >
            <motion.div
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 border"
              style={{
                background: "oklch(0.18 0.07 55)",
                borderColor: "oklch(0.72 0.18 55)",
                opacity: 0.95,
              }}
              animate={
                simRunning ? { opacity: [0.85, 1, 0.85] } : { opacity: 0.92 }
              }
              transition={
                simRunning
                  ? { repeat: Number.POSITIVE_INFINITY, duration: 1.4 }
                  : {}
              }
            >
              <span
                className="text-[10px] font-mono font-bold tabular-nums leading-none"
                style={{ color: "oklch(0.72 0.18 55)" }}
              >
                Trail SL
              </span>
              <span
                className="text-[10px] font-mono tabular-nums leading-none"
                style={{ color: "oklch(0.85 0.14 55)", opacity: 0.95 }}
              >
                {formatCurrency(effectiveSimTrailSL)}
              </span>
              <span
                className="text-[9px] font-mono leading-none"
                style={{ color: "oklch(0.72 0.18 55)", opacity: 0.7 }}
              >
                {trailAnnotation}
              </span>
              {simRunning && (
                <button
                  type="button"
                  data-ocid="chart.trail_sim.cancel_button"
                  onClick={stopSim}
                  className="ml-0.5 rounded-sm hover:opacity-100 transition-opacity flex items-center gap-0.5"
                  style={{
                    pointerEvents: "auto",
                    color: "oklch(0.72 0.18 55)",
                    opacity: 0.75,
                  }}
                  title="Stop simulation"
                >
                  <Square className="w-2 h-2 fill-current" />
                </button>
              )}
            </motion.div>
          </div>
          {/* Left dot */}
          <div
            className="absolute left-0 -translate-y-1/2"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full ml-1"
              style={{
                background: "oklch(0.72 0.18 55)",
                opacity: 0.9,
                boxShadow: "0 0 4px oklch(0.72 0.18 55)",
              }}
            />
          </div>
        </motion.div>
      )}

      {/* ── Simulation: ghost SIM PRICE line ─────────────────────────────── */}
      {simActive && simRunning && simPriceY !== null && (
        <motion.div
          className="absolute left-0 right-0"
          animate={{ top: `${simPriceY}px` }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
          style={{ pointerEvents: "none" }}
        >
          {/* Faint cyan dashed line */}
          <div
            className="absolute left-0 right-0"
            style={{
              height: "1px",
              borderTop: "1px dashed oklch(0.82 0.12 200)",
              opacity: 0.35,
            }}
          />
          {/* Label pill */}
          <div className="absolute right-24 -translate-y-1/2">
            <div
              className="flex items-center gap-1 rounded px-1.5 py-0.5 border"
              style={{
                background: "oklch(0.14 0.05 200)",
                borderColor: "oklch(0.50 0.10 200)",
                opacity: 0.55,
              }}
            >
              <span
                className="text-[9px] font-mono font-semibold leading-none"
                style={{ color: "oklch(0.82 0.12 200)" }}
              >
                SIM
              </span>
              <span
                className="text-[9px] font-mono tabular-nums leading-none"
                style={{ color: "oklch(0.82 0.12 200)" }}
              >
                {formatCurrency(simPrice)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TRAIL ACTIVE badge (top-right) ───────────────────────────────── */}
      <AnimatePresence>
        {simActive && (
          <motion.div
            key="trail-badge"
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="absolute top-3 right-3 flex flex-col items-end gap-1"
            style={{ pointerEvents: "auto" }}
            data-ocid="chart.trail_sim.panel"
          >
            {/* Status badge row */}
            <div
              className="flex items-center gap-1.5 rounded-md px-2 py-1 border"
              style={{
                background: "oklch(0.14 0.06 55)",
                borderColor: "oklch(0.55 0.16 55)",
              }}
            >
              {simRunning && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "oklch(0.75 0.18 55)" }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 0.9,
                  }}
                />
              )}
              {simFinished && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "oklch(0.55 0.10 55)" }}
                />
              )}
              <span
                className="text-[9px] font-mono font-bold tracking-wide leading-none uppercase"
                style={{
                  color: simRunning
                    ? "oklch(0.80 0.18 55)"
                    : "oklch(0.60 0.12 55)",
                }}
              >
                {simRunning ? "TRAIL ACTIVE ▲" : "TRAIL SIM DONE"}
              </span>
              {simRunning && (
                <button
                  type="button"
                  data-ocid="chart.trail_sim.close_button"
                  onClick={stopSim}
                  className="ml-0.5 rounded transition-opacity hover:opacity-100"
                  style={{
                    pointerEvents: "auto",
                    color: "oklch(0.65 0.14 55)",
                    opacity: 0.75,
                  }}
                  title="Stop trailing simulation"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Speed selector pills — visible when simulation is active */}
            <AnimatePresence>
              {trailingSL && (
                <motion.div
                  key="speed-pills"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-0.5 rounded-md px-1.5 py-1 border"
                  style={{
                    background: "oklch(0.11 0.04 55 / 0.85)",
                    borderColor: "oklch(0.40 0.10 55 / 0.5)",
                    pointerEvents: "auto",
                    backdropFilter: "blur(4px)",
                  }}
                  data-ocid="chart.trail_sim.panel"
                >
                  {(["slow", "normal", "fast"] as SimSpeed[]).map((speed) => {
                    const active = simSpeed === speed;
                    return (
                      <button
                        key={speed}
                        type="button"
                        data-ocid="chart.trail_sim.toggle"
                        onClick={() => handleSpeedChange(speed)}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide leading-none transition-all duration-150"
                        style={{
                          background: active
                            ? "oklch(0.72 0.18 55)"
                            : "transparent",
                          color: active
                            ? "oklch(0.14 0.06 55)"
                            : "oklch(0.65 0.14 55)",
                          opacity: active ? 1 : 0.55,
                          pointerEvents: "auto",
                          border: active
                            ? "1px solid oklch(0.72 0.18 55)"
                            : "1px solid transparent",
                        }}
                        title={`Set simulation speed to ${SPEED_CONFIGS[speed].label}`}
                      >
                        {SPEED_CONFIGS[speed].label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shaded zones ─────────────────────────────────────────────────── */}
      {stopLoss !== null && !simActive && (
        <ShadedZone
          price1={entryPrice}
          price2={stopLoss}
          high={visiblePriceHigh}
          low={visiblePriceLow}
          heightPx={chartHeightPx}
          color={
            lines.trailingSL ? "oklch(0.72 0.18 55)" : "oklch(0.65 0.22 15)"
          }
          opacity={0.04}
        />
      )}
      {simActive && effectiveSimTrailSL !== null && (
        <ShadedZone
          price1={entryPrice}
          price2={effectiveSimTrailSL}
          high={visiblePriceHigh}
          low={visiblePriceLow}
          heightPx={chartHeightPx}
          color="oklch(0.72 0.18 55)"
          opacity={0.05}
        />
      )}
      {takeProfit !== null && (
        <ShadedZone
          price1={entryPrice}
          price2={takeProfit}
          high={visiblePriceHigh}
          low={visiblePriceLow}
          heightPx={chartHeightPx}
          color="oklch(0.65 0.20 145)"
          opacity={0.04}
        />
      )}
    </motion.div>
  );
}

// Shaded region between two price levels
function ShadedZone({
  price1,
  price2,
  high,
  low,
  heightPx,
  color,
  opacity,
}: {
  price1: number;
  price2: number;
  high: number;
  low: number;
  heightPx: number;
  color: string;
  opacity: number;
}) {
  const y1 = priceToY(price1, high, low, heightPx);
  const y2 = priceToY(price2, high, low, heightPx);
  const top = Math.min(y1, y2);
  const height = Math.abs(y1 - y2);

  if (height < 1) return null;

  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        background: color,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}
