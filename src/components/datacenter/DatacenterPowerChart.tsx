"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

// ApexCharts côté client uniquement
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// ---- Types & constantes ----

const SERIES_KEYS = ["enterprise", "colocation", "cloud", "mining"] as const;
type DcTypeKey = (typeof SERIES_KEYS)[number];

type PowerPoint = { x: number; y: number };
type SeriesState = Record<DcTypeKey, PowerPoint[]>;

// 1 mise à jour toutes les heures
const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// 24 points = les 24 dernières heures
const MAX_POINTS = 24;

// baseline approximative par type (MW)
const BASELINES: Record<DcTypeKey, number> = {
  enterprise: 5000,
  colocation: 23000,
  cloud: 42000,
  mining: 8000,
};

// couleurs cohérentes avec tes cards (indigo, emerald, sky, amber)
const TYPE_META: Record<DcTypeKey, { label: string; color: string }> = {
  enterprise: { label: "Enterprise", color: "#6366F1" }, // indigo-500
  colocation: { label: "Colocation", color: "#10B981" }, // emerald-500
  cloud: { label: "Cloud", color: "#0EA5E9" }, // sky-500
  mining: { label: "Mining", color: "#F59E0B" }, // amber-500
};

// petite variation autour de la valeur précédente
function jitter(prev: number, base: number): number {
  const maxDelta = base * 0.01; // ±1 %
  const delta = (Math.random() * 2 - 1) * maxDelta;
  return Math.max(0, prev + delta);
}

function createInitialSeries(): SeriesState {
  const start = Date.now() - (MAX_POINTS - 1) * UPDATE_INTERVAL_MS;
  const state = {} as SeriesState;

  SERIES_KEYS.forEach((key) => {
    const base = BASELINES[key];
    const points: PowerPoint[] = [];
    let value = base;

    for (let i = 0; i < MAX_POINTS; i++) {
      value = jitter(value, base);
      points.push({
        x: start + i * UPDATE_INTERVAL_MS,
        y: value,
      });
    }

    state[key] = points;
  });

  return state;
}

function updateSeries(prev: SeriesState): SeriesState {
  const next: SeriesState = {} as SeriesState;

  SERIES_KEYS.forEach((key) => {
    const prevPoints = prev[key];
    const last = prevPoints[prevPoints.length - 1];
    const base = BASELINES[key];
    const nextTime = (last?.x ?? Date.now()) + UPDATE_INTERVAL_MS;
    const nextValue = jitter(last?.y ?? base, base);

    const updated = [...prevPoints, { x: nextTime, y: nextValue }];
    next[key] = updated.slice(-MAX_POINTS);
  });

  return next;
}

function formatMw(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

// ---- Composant principal ----

export default function DatacenterPowerChart() {
  // null au départ pour éviter Date.now()/random pendant le SSR
  const [seriesState, setSeriesState] = useState<SeriesState | null>(null);

  const [visible, setVisible] = useState<Record<DcTypeKey, boolean>>({
    enterprise: true,
    colocation: true,
    cloud: true,
    mining: true,
  });

  const [mounted, setMounted] = useState(false);

  // On crée les données UNIQUEMENT côté client après montage
  useEffect(() => {
    setMounted(true);
    setSeriesState(createInitialSeries());

    const id = setInterval(() => {
      setSeriesState((prev) => (prev ? updateSeries(prev) : prev));
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  const hasData = !!seriesState;

  // options Apex (stables & déterministes)
  const options: ApexOptions = useMemo(
    () => ({
      legend: {
        show: false,
      },
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: 310,
        type: "area",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "linear",
          dynamicAnimation: {
            speed: UPDATE_INTERVAL_MS,
          },
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.35,
          opacityTo: 0,
        },
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      markers: {
        size: 0,
      },
      grid: {
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        x: {
          format: "dd MMM HH:mm",
        },
        y: {
          formatter(val: number) {
            return `${formatMw(val)} MW`;
          },
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        title: {
          text: "",
        },
        labels: {
          formatter(val: number) {
            if (val >= 1000) {
              return `${Math.round(val / 1000)}k`;
            }
            return `${Math.round(val)}`;
          },
        },
      },
    }),
    []
  );

  // séries visibles pour Apex
  const enabledKeys = hasData
    ? (SERIES_KEYS.filter((key) => visible[key]) as DcTypeKey[])
    : [];

  const apexSeries = hasData
    ? enabledKeys.map((key) => ({
        name: TYPE_META[key].label,
        data: seriesState![key],
        color: TYPE_META[key].color,
      }))
    : [];

  // total + variation sur le dernier pas de temps
  const { totalMw, changePct, trend } = useMemo(() => {
    if (!hasData) {
      return {
        totalMw: 0,
        changePct: 0,
        trend: "up" as const,
      };
    }

    let totalNow = 0;
    let totalPrev = 0;

    enabledKeys.forEach((key) => {
      const points = seriesState![key];
      const len = points.length;
      if (!len) return;
      totalNow += points[len - 1].y;
      totalPrev += points[len - 2]?.y ?? points[len - 1].y;
    });

    const diff = totalNow - totalPrev;
    const pct = totalPrev > 0 ? (diff / totalPrev) * 100 : 0;

    return {
      totalMw: totalNow,
      changePct: pct,
      trend: diff >= 0 ? ("up" as const) : ("down" as const),
    };
  }, [seriesState, enabledKeys, hasData]);

  // dernière valeur MW pour chaque type
  const latestValues = useMemo(() => {
    const result = {} as Record<DcTypeKey, number>;
    SERIES_KEYS.forEach((key) => {
      if (!seriesState) {
        result[key] = 0;
        return;
      }
      const points = seriesState[key];
      const last = points[points.length - 1];
      result[key] = last ? last.y : 0;
    });
    return result;
  }, [seriesState]);

  const badgeBase =
    "flex items-center gap-1 rounded-full px-2 py-0.5 text-theme-xs font-medium";
  const badgeUp =
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
  const badgeDown =
    "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Global Datacenter Power Usage
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Hourly · last 24 hours · MW
          </p>
        </div>

        <div className="flex flex-row-reverse items-center justify-end gap-0.5 sm:flex-col sm:items-start">
          <div className="flex flex-row-reverse items-center gap-3 sm:flex-row sm:gap-2">
            <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {hasData ? formatMw(totalMw) : "—"} MW
            </h4>
            {hasData && (
              <span
                className={
                  badgeBase +
                  " " +
                  (trend === "up" ? badgeUp : badgeDown)
                }
              >
                {`${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`}
              </span>
            )}
          </div>
          <span className="text-gray-500 text-theme-xs dark:text-gray-400">
            Total visible power
          </span>
        </div>
      </div>

      {/* Filtres types */}
      <div className="mb-2 flex flex-wrap gap-2">
        {SERIES_KEYS.map((key) => {
          const meta = TYPE_META[key];
          const active = visible[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                setVisible((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-transparent bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
                  : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400 bg-transparent"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span>{meta.label}</span>
              {!active && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  off
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Valeurs par type (MW) */}
      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-4">
        {SERIES_KEYS.map((key) => {
          const meta = TYPE_META[key];
          const val = latestValues[key] ?? 0;
          const active = visible[key];

          return (
            <div key={key} className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: meta.color,
                    opacity: active ? 1 : 0.35,
                  }}
                />
                <span>{meta.label}</span>
              </span>
              <span
                className={
                  active
                    ? "font-medium text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500"
                }
              >
                {hasData ? formatMw(val) : "—"}{" "}
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  MW
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full -ml-4 pl-2">
          {mounted && hasData ? (
            <ReactApexChart
              options={options}
              series={apexSeries}
              type="area"
              height={310}
            />
          ) : (
            <div className="h-[310px] w-full rounded-xl bg-gray-100/80 dark:bg-white/5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
