import type { Metadata } from "next";
import MapAndPicker, { Datacenter } from "@/components/maps/MapAndPicker";

export const metadata: Metadata = {
  title: "DC Power — Map",
  description: "Top map + picker",
};

export default async function DatacentersMapPage() {
  const MT = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // Style clair (utilisé pour clair + sombre)
  const styleUrl = MT
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MT}`
    : "https://tiles.versatiles.org/assets/styles/colorful/style.json";

  // 🔁 Récupère les points depuis ton backend (datacenter_map_points)
  let data: Datacenter[] = [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/datacenters/map`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Map API error:", res.status, await res.text());
    } else {
      const json = await res.json();
      const items =
        (json.items as Array<{
          uid: string;
          name: string;
          lng: number;
          lat: number;
        }>) ?? [];

      data = items.map((it) => ({
        id: it.uid,
        name: it.name,
        brand: "", // tu complèteras plus tard depuis v5 si tu veux
        country: "",
        rating: 0,
        lng: it.lng,
        lat: it.lat,
        logoUrl: undefined,
      }));
    }
  } catch (err) {
    console.error("Failed to load datacenters for map:", err);
  }

  const H = "calc(100vh - 80px)";

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <MapAndPicker
          data={data}
          styleUrl={styleUrl}
          center={[2.35, 48.85]} // fallback si géoloc non dispo
          zoom={5}
          height={H}
        />
      </div>
    </div>
  );
}
