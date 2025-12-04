"use client";

import { useMemo, useState } from "react";
import MapLibreWidget, { MapMarker } from "./MapLibreWidget";

export type Datacenter = {
  id: string;
  name: string;
  brand: string; // Equinix, OVHcloud, etc.
  country: string; // ISO name ou code (ex: "FR", "France")
  rating?: number; // 0..5 (note)
  lng: number;
  lat: number;
  logoUrl?: string;
};

type Props = {
  data: Datacenter[];
  styleUrl: string; // on force le style clair pour tous les thèmes
  center: [number, number];
  zoom?: number;
  height?: number | string; // ex: "calc(100vh - 96px)"
};

export default function MapAndPicker({
  data,
  styleUrl,
  center,
  zoom = 5,
  height = "calc(100vh - 96px)",
}: Props) {
  // --- états UI ---
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(data.map((d) => d.id)) // tout sélectionné par défaut
  );
  const [country, setCountry] = useState<string>("Tous");
  const [minRating, setMinRating] = useState<number>(0); // 0..5
  const [sortBy, setSortBy] = useState<"relevance" | "ratingDesc" | "nameAsc">(
    "ratingDesc"
  );

  // --- options de pays ---
  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))).sort(),
    [data]
  );

  // --- filtrage ---
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    let rows = data.filter((d) => {
      const okSearch =
        !term ||
        d.name.toLowerCase().includes(term) ||
        d.brand.toLowerCase().includes(term) ||
        d.country.toLowerCase().includes(term);

      const okCountry = country === "Tous" || d.country === country;
      const note = d.rating ?? 0;
      const okRating = note >= minRating;

      return okSearch && okCountry && okRating;
    });

    // --- tri ---
    if (sortBy === "ratingDesc") {
      rows = rows.sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name)
      );
    } else if (sortBy === "nameAsc") {
      rows = rows.sort((a, b) => a.name.localeCompare(b.name));
    } // "relevance": on garde l'ordre courant

    return rows;
  }, [data, q, country, minRating, sortBy]);

  // --- marqueurs (ids sélectionnés, sinon ceux filtrés) ---
  const markers: MapMarker[] = useMemo(() => {
    const ids = selected.size ? selected : new Set(filtered.map((f) => f.id));
    return data
      .filter((d) => ids.has(d.id))
      .map((d) => ({
        id: d.id,
        name: d.name,
        lng: d.lng,
        lat: d.lat,
      }));
  }, [data, selected, filtered]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVisible = () => setSelected(new Set(filtered.map((f) => f.id)));
  const clearSelection = () => setSelected(new Set());

  const panelStyle =
    typeof height === "number" ? { height: `${height}px` } : { height };

  // petit rendu étoiles (note)
  const Stars = ({ v = 0 }: { v?: number }) => {
    const full = Math.floor(v);
    const half = v - full >= 0.5;
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`}>★</span>
        ))}
        {half && <span>☆</span>}
        {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
          <span key={`e${i}`} className="opacity-40">
            ☆
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Map à gauche */}
      <div className="col-span-12 xl:col-span-9">
        <MapLibreWidget
          className=""
          center={center}
          zoom={zoom}
          styleUrlOverride={styleUrl} // clair pour clair + sombre
          markers={markers}
          height={height}
          // 👇 même comportement que la mini-map, mais ici on veut la géoloc
          autoCenterFromBrowser={true}
          autoCenterZoom={7}
          minMarkerZoom={4}
        />
      </div>

      {/* Panneau à droite : même hauteur, dark-friendly */}
      <div className="col-span-12 xl:col-span-3">
        <div
          style={panelStyle}
          className="
            flex h-full flex-col rounded-2xl border p-5 shadow-default
            bg-white border-slate-200
            dark:bg-[#1C2434] dark:border-[#334155]
          "
        >
          <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            Datacenters
          </h3>

          {/* Barre de recherche */}
          <div className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom / brand / pays..."
              className="
                w-full rounded-lg border px-3 py-2 text-sm outline-none transition
                bg-white text-slate-900 placeholder-slate-400 border-slate-200
                focus:border-primary
                dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-[#334155]
              "
            />
          </div>

          {/* Filtres avancés */}
          <div className="mb-3 grid grid-cols-1 gap-2">
            {/* Pays */}
            <div className="flex items-center gap-2">
              <label className="w-20 text-xs text-slate-600 dark:text-slate-300">
                Pays
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="
                  flex-1 rounded-md border bg-white px-2 py-1.5 text-sm
                  border-slate-200 text-slate-800
                  dark:bg-slate-900 dark:text-slate-100 dark:border-[#334155]
                "
              >
                <option value="Tous">Tous</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Min note */}
            <div className="flex items-center gap-2">
              <label className="w-20 text-xs text-slate-600 dark:text-slate-300">
                Min note
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-right text-xs text-slate-700 dark:text-slate-200">
                {minRating}
              </span>
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <label className="w-20 text-xs text-slate-600 dark:text-slate-300">
                Trier
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "relevance" | "ratingDesc" | "nameAsc"
                  )
                }
                className="
                  flex-1 rounded-md border bg-white px-2 py-1.5 text-sm
                  border-slate-200 text-slate-800
                  dark:bg-slate-900 dark:text-slate-100 dark:border-[#334155]
                "
              >
                <option value="ratingDesc">Meilleure note</option>
                <option value="relevance">Pertinence</option>
                <option value="nameAsc">Nom (A→Z)</option>
              </select>
            </div>
          </div>

          {/* Actions sélection */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={selectVisible}
              className="rounded-md bg-primary/90 px-3 py-1 text-xs font-medium text-white hover:bg-primary"
            >
              Tout (filtré)
            </button>
            <button
              onClick={clearSelection}
              className="rounded-md border px-3 py-1 text-xs font-medium
                         border-slate-200 text-slate-700 hover:bg-slate-50
                         dark:border-[#334155] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Aucun
            </button>
          </div>

          {/* Liste verticale avec scroll */}
          <div className="mt-1 flex-1 overflow-y-auto">
            <ul className="space-y-2 pr-1">
              {filtered.map((d) => {
                const isOn = selected.has(d.id);
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => toggle(d.id)}
                      className={`
                        group w-full text-left transition
                        flex items-center gap-3 rounded-xl border px-3 py-2
                        ${
                          isOn
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-slate-200 dark:border-[#334155] opacity-60 grayscale"
                        }
                        bg-slate-50 dark:bg-slate-900
                      `}
                    >
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                        {d.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={d.logoUrl}
                            alt={d.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.currentTarget.parentElement as HTMLElement
                              ).textContent = d.name.slice(0, 2).toUpperCase();
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {d.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {d.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {d.brand} • {d.country}
                        </p>
                        {typeof d.rating === "number" && (
                          <div className="mt-0.5">
                            <Stars v={d.rating} />
                          </div>
                        )}
                      </div>

                      <input
                        type="checkbox"
                        readOnly
                        checked={isOn}
                        className="pointer-events-none h-4 w-4 accent-primary"
                        aria-label={`Sélectionner ${d.name}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
