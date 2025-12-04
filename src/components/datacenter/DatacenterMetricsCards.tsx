"use client";

import React, { useEffect, useState } from "react";
import { DollarLineIcon, GroupIcon, ShootingStarIcon } from "../../icons";

type MetricsResponse = {
  total: number;
  byType: Record<string, number>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function DatacenterMetricsCards() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Appel de l'API au montage
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/dashboard/datacenters/metrics`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as MetricsResponse;
        setMetrics(json);
      } catch (err) {
        console.error("Failed to load metrics", err);
        setError("Impossible de charger les métriques.");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  // 2) On lit les valeurs renvoyées par l'API
  const enterpriseCount = metrics?.byType["enterprise"] ?? 0;
  const colocationCount = metrics?.byType["colocation"] ?? 0;
  const cloudCount = metrics?.byType["cloud"] ?? 0;
  const cryptoCount =
    metrics?.byType["crypto_mining"] ?? metrics?.byType["mining_farm"] ?? 0;

  const cards = [
    {
      label: "Enterprise data center",
      value: enterpriseCount,
      change: "+4.2%",
      trend: "up" as const,
      Icon: ShootingStarIcon,
    },
    {
      label: "Colocation data center",
      value: colocationCount,
      change: "+1.8%",
      trend: "up" as const,
      Icon: GroupIcon,
    },
    {
      label: "Cloud data center",
      value: cloudCount,
      change: "+6.3%",
      trend: "up" as const,
      Icon: DollarLineIcon,
    },
    {
      label: "Crypto mining farm",
      value: cryptoCount,
      change: "-2.4%",
      trend: "down" as const,
      Icon: ShootingStarIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {cards.map(({ label, value, change, trend, Icon }) => {
        const badgeBase =
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-theme-xs font-medium";
        const badgeUp =
          "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500";
        const badgeDown =
          "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500";

        return (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white/[0.90]">
              <Icon />
            </div>

            <p className="text-gray-500 text-theme-sm dark:text-gray-400">
              {label}
            </p>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {loading ? "…" : value.toLocaleString("en-US")}
                </h4>

                {error && (
                  <p className="mt-1 text-xs text-error-500">{error}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={
                    badgeBase + " " + (trend === "up" ? badgeUp : badgeDown)
                  }
                >
                  {change}
                </span>
                <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                  Vs last month
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
