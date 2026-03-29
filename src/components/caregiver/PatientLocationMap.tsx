import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type GpsLog = Tables<"gps_logs">;

// Fix default marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function PatientLocationMap() {
  const [latestGps, setLatestGps] = useState<GpsLog | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("gps_logs")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (data?.[0]) setLatestGps(data[0]);
    };
    fetchLatest();

    const channel = supabase
      .channel("gps-map-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gps_logs" }, (payload) => {
        setLatestGps(payload.new as GpsLog);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!latestGps) {
    return (
      <div className="h-64 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Waiting for patient location data...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-64 rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[latestGps.latitude, latestGps.longitude]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latestGps.latitude, latestGps.longitude]} icon={markerIcon}>
            <Popup>
              Patient's location<br />
              {format(new Date(latestGps.recorded_at), "h:mm:ss a")}
            </Popup>
          </Marker>
          <RecenterMap lat={latestGps.latitude} lng={latestGps.longitude} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Last update: {format(new Date(latestGps.recorded_at), "h:mm:ss a")}
      </p>
    </div>
  );
}
