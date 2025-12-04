"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapMarker = {
  id: string;
  name: string;
  lng: number;
  lat: number;
};

type Props = {
  lightStyleUrl?: string;
  darkStyleUrl?: string;
  /** Une seule URL pour clair + sombre (si fournie, elle a la priorité) */
  styleUrlOverride?: string;
  /** Centre par défaut si la géoloc ne marche pas */
  center?: [number, number];
  zoom?: number;
  /** Hauteur : px (number) ou CSS (ex: "75vh" ou "calc(100vh - 120px)") */
  height?: number | string;
  markers?: MapMarker[];
  className?: string;
  /** Si true, tente de centrer la carte sur la position du navigateur */
  autoCenterFromBrowser?: boolean;
  /** Zoom utilisé quand on centre sur la géoloc */
  autoCenterZoom?: number;
  /** Zoom minimal avant d’afficher les marqueurs */
  minMarkerZoom?: number;
};

export default function MapLibreWidget({
  lightStyleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${
    process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""
  }`,
  darkStyleUrl = `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${
    process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ""
  }`,
  styleUrlOverride,
  center = [2.35, 48.85], // Paris en fallback
  zoom = 4,
  height = "calc(100vh - 140px)",
  markers = [],
  className = "",
  autoCenterFromBrowser = true,
  autoCenterZoom = 7,
  minMarkerZoom = 4,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const styleRef = useRef<string>("");

  const markerRefs = useRef<maplibregl.Marker[]>([]);

  // on fige les valeurs initiales pour éviter les problèmes de re-rendu
  const initialCenterRef = useRef<[number, number]>(center);
  const initialZoomRef = useRef<number>(zoom);
  const initialMinMarkerZoomRef = useRef<number>(minMarkerZoom);

  const pickStyle = useMemo(() => {
    if (styleUrlOverride) return () => styleUrlOverride;
    const isDark = () => document.documentElement.classList.contains("dark");
    return () => (isDark() ? darkStyleUrl : lightStyleUrl);
  }, [styleUrlOverride, lightStyleUrl, darkStyleUrl]);

  /** Création de la carte : une seule fois */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    styleRef.current = pickStyle();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleRef.current,
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120 }),
      "bottom-left"
    );

    // Switch light/dark
    const html = document.documentElement;
    const obs = new MutationObserver(() => {
      const next = pickStyle();
      if (next && next !== styleRef.current) {
        styleRef.current = next;
        map.setStyle(next);
      }
    });
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });

    // Resize responsive
    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    // Afficher / cacher les marqueurs selon le zoom
    const handleZoom = () => {
      const minZoom = initialMinMarkerZoomRef.current;
      const visible = map.getZoom() >= minZoom;
      markerRefs.current.forEach((m) => {
        const el = m.getElement();
        el.style.opacity = visible ? "1" : "0";
      });
    };
    map.on("zoom", handleZoom);

    mapRef.current = map;
    handleZoom(); // état initial

    return () => {
      window.removeEventListener("resize", onResize);
      obs.disconnect();
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];
      map.off("zoom", handleZoom);
      map.remove();
      mapRef.current = null;
    };
    // ⬇️ on ne dépend QUE de pickStyle, donc la carte est créée une seule fois
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickStyle]);

  /** Géoloc : centrer sur la position du navigateur (si possible) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !autoCenterFromBrowser) return;
    if (typeof window === "undefined") return;

    // HTTPS ou localhost obligatoire pour la géoloc
    if (!window.isSecureContext) {
      console.warn(
        "[MapLibreWidget] Geolocation bloquée : il faut utiliser HTTPS ou http://localhost"
      );
      return;
    }

    if (!navigator.geolocation) {
      console.warn("[MapLibreWidget] navigator.geolocation non disponible");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: autoCenterZoom,
          essential: true,
        });
      },
      (err) => {
        console.warn("[MapLibreWidget] Geolocation failed:", err);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
      }
    );
  }, [autoCenterFromBrowser, autoCenterZoom]);

  /** Création / mise à jour des marqueurs */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // supprimer les anciens
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    markers.forEach((d) => {
      const el = document.createElement("div");
      el.className =
        "rounded-full shadow-md flex items-center justify-center overflow-hidden";
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.border = "1px solid #ffffffAA";
      el.style.background = "#3b82f6";
      el.style.boxShadow = "0 0 6px rgba(15, 23, 42, 0.4)";
      el.style.color = "white";
      el.style.fontSize = "11px";
      el.style.fontWeight = "700";
      el.textContent = d.name.slice(0, 1).toUpperCase();

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([d.lng, d.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(d.name))
        .addTo(map);

      markerRefs.current.push(marker);
    });

    // appliquer la logique visible/masqué selon le zoom actuel
    const minZoom = initialMinMarkerZoomRef.current;
    const visible = map.getZoom() >= minZoom;
    markerRefs.current.forEach((m) => {
      const el = m.getElement();
      el.style.opacity = visible ? "1" : "0";
    });
  }, [markers]);

  const heightStyle =
    typeof height === "number" ? { height: `${height}px` } : { height };

  return (
    <div className={className}>
      <div
        ref={containerRef}
        style={heightStyle}
        className="w-full overflow-hidden rounded-2xl bg-transparent"
      />
      <style jsx global>{`
        .maplibregl-canvas {
          background: transparent !important;
        }
        .maplibregl-ctrl,
        .maplibregl-ctrl-group {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
