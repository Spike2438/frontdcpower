"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, {
  Map,
  MapLayerMouseEvent,
  GeoJSONSource,
} from "maplibre-gl";
import type { FeatureCollection, Feature, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapMarker = {
  id: string;
  name: string;
  lng: number;
  lat: number;
};

type MarkerProperties = {
  id: string;
  name: string;
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

const SOURCE_ID = "dc-points";
const LAYER_ID = "dc-points-layer";

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

  const sourceReadyRef = useRef(false);
  const markersRef = useRef<MapMarker[]>([]);

  // valeurs initiales figées pour éviter de recréer la carte
  const initialCenterRef = useRef<[number, number]>(center);
  const initialZoomRef = useRef<number>(zoom);
  const initialMinMarkerZoomRef = useRef<number>(minMarkerZoom);

  const pickStyle = useMemo(() => {
    if (styleUrlOverride) return () => styleUrlOverride;
    const isDark = () => document.documentElement.classList.contains("dark");
    return () => (isDark() ? darkStyleUrl : lightStyleUrl);
  }, [styleUrlOverride, lightStyleUrl, darkStyleUrl]);

  /** Helper pour pousser les markers dans la source GeoJSON */
  const updateSourceWithMarkers = () => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) return;

    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!src) return;

    const features: Feature<Point, MarkerProperties>[] = markersRef.current.map(
      (m) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [m.lng, m.lat],
        },
        properties: {
          id: m.id,
          name: m.name,
        },
      })
    );

    const geojson: FeatureCollection<Point, MarkerProperties> = {
      type: "FeatureCollection",
      features,
    };

    src.setData(geojson);

    const minZoom = initialMinMarkerZoomRef.current;
    const visible = map.getZoom() >= minZoom;
    map.setPaintProperty(LAYER_ID, "circle-opacity", visible ? 1 : 0);
  };

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

    // Switch light/dark (on recharge le style)
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

    const onLoad = () => {
      // Source GeoJSON
      if (!map.getSource(SOURCE_ID)) {
        const empty: FeatureCollection<Point, MarkerProperties> = {
          type: "FeatureCollection",
          features: [],
        };

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: empty,
        });
      }

      // Layer circle
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-radius": 4,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0,
          },
        });
      }

      // Popups au clic
      map.on("click", LAYER_ID, (e: MapLayerMouseEvent) => {
        const feature = e.features && e.features[0];
        if (!feature || feature.geometry.type !== "Point") return;

        const geometry = feature.geometry;
        const coords = geometry.coordinates as [number, number];

        const props = feature.properties as MarkerProperties | null;
        const name = props?.name ?? "";

        new maplibregl.Popup({ offset: 12 })
          .setLngLat(coords)
          .setText(name)
          .addTo(map);
      });

      // curseur pointer sur les points
      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      // Afficher / cacher selon le zoom
      const handleZoom = () => {
        const minZoom = initialMinMarkerZoomRef.current;
        const visible = map.getZoom() >= minZoom;
        map.setPaintProperty(LAYER_ID, "circle-opacity", visible ? 1 : 0);
      };
      map.on("zoom", handleZoom);
      handleZoom();

      sourceReadyRef.current = true;
      // On pousse les markers actuels (si déjà reçus du parent)
      updateSourceWithMarkers();
    };

    map.on("load", onLoad);

    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", onResize);
      obs.disconnect();
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      map.remove();
      mapRef.current = null;
      sourceReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickStyle]);

  /** Géoloc : centrer sur la position du navigateur */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !autoCenterFromBrowser) return;
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      console.warn(
        "[MapLibreWidget] Geolocation bloquée : utiliser HTTPS ou http://localhost"
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

  /** Mise à jour des points : on ne touche qu'à la source GeoJSON */
  useEffect(() => {
    markersRef.current = markers;
    updateSourceWithMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
