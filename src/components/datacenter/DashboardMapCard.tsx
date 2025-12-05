"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MapLibreWidget, { MapMarker } from "@/components/maps/MapLibreWidget";

const MAP_ROUTE = "/"; // ta page Map = src/app/(admin)/page.tsx
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function DashboardMapCard() {
  const router = useRouter();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MT = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const styleUrl = MT
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MT}`
    : "https://tiles.versatiles.org/assets/styles/colorful/style.json";

  useEffect(() => {
    async function fetchMarkers() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/dashboard/datacenters/map`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const items =
          (json.items as Array<{
            uid: string;
            name: string;
            lng: number;
            lat: number;
          }>) ?? [];

        const mapped: MapMarker[] = items
          .filter(
            (it) => typeof it.lng === "number" && typeof it.lat === "number"
          )
          .map((it) => ({
            id: it.uid,
            name: it.name,
            lng: it.lng,
            lat: it.lat,
          }));

        setMarkers(mapped);
      } catch (err) {
        console.error("Failed to load dashboard map markers", err);
        setError("Impossible de charger les datacenters.");
      } finally {
        setLoading(false);
      }
    }

    fetchMarkers();
  }, []);

  const goToMap = () => {
    router.push(MAP_ROUTE);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {/* Header de la card */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Global Datacenter Map
          </p>
          <h4 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
            World coverage overview
          </h4>
        </div>

        <button
          type="button"
          onClick={goToMap}
          className="rounded-full bg-success-50 px-3 py-1 text-theme-xs font-medium text-success-600
                     dark:bg-success-500/15 dark:text-success-500
                     hover:bg-success-100 dark:hover:bg-success-500/25
                     transition-colors cursor-pointer"
        >
          Voir la carte
        </button>
      </div>

      {/* Map */}
      <div className="mt-2 rounded-xl overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-black/40 text-xs text-gray-600 dark:text-gray-200">
            Chargement des datacenters...
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-black/40 text-xs text-red-600">
            {error}
          </div>
        )}

        <MapLibreWidget
          height={300}
          center={[2.35, 48.85]} // fallback si géoloc non disponible
          zoom={4}
          markers={markers}
          lightStyleUrl={styleUrl}
          darkStyleUrl={styleUrl}
          autoCenterFromBrowser={true} // 👈 géoloc activée
          autoCenterZoom={7} // 👈 zoom sur ta région
          minMarkerZoom={3} // points visibles dès qu'on est un peu zoomé
        />
      </div>
    </div>
  );
}
