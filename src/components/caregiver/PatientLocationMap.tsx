import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type GpsLog = Tables<"gps_logs">;
type FamilyContact = Tables<"family_contacts">;

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
  const [fallbackContact, setFallbackContact] = useState<FamilyContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data: gpsData } = await supabase
        .from("gps_logs")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (gpsData?.[0]) {
        setLatestGps(gpsData[0]);
      } else {
        const { data: contacts } = await supabase
          .from("family_contacts")
          .select("*")
          .limit(1);
        if (contacts?.[0]) setFallbackContact(contacts[0]);
      }
      setLoading(false);
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

  const mapLat = latestGps?.latitude ?? fallbackContact?.latitude;
  const mapLng = latestGps?.longitude ?? fallbackContact?.longitude;
  const isLive = !!latestGps;

  if (loading) {
    return (
      <div className="h-64 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Loading location data...
      </div>
    );
  }

  if (!mapLat || !mapLng) {
    return (
      <div className="h-64 rounded-xl bg-muted flex flex-col items-center justify-center text-sm text-muted-foreground gap-2 px-4 text-center">
        <p className="font-semibold">No location data yet</p>
        <p>Open the Patient Dashboard on the patient's device to start GPS tracking. The patient's browser must allow location access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!isLive && (
        <div className="bg-warning/10 text-warning rounded-lg px-3 py-2 text-xs font-medium">
          ⚠️ No live GPS — showing nearest family contact location. Open the Patient Dashboard to enable tracking.
        </div>
      )}
      <div className="h-64 rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[mapLat, mapLng]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[mapLat, mapLng]} icon={markerIcon}>
            <Popup>
              {isLive ? (
                <>Patient's location<br />{format(new Date(latestGps!.recorded_at), "h:mm:ss a")}</>
              ) : (
                <>📍 {fallbackContact?.name}'s location</>
              )}
            </Popup>
          </Marker>
          <RecenterMap lat={mapLat} lng={mapLng} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        {isLive
          ? `🟢 Live · Last update: ${format(new Date(latestGps!.recorded_at), "h:mm:ss a")}`
          : "🔴 Offline · Waiting for patient GPS data"}
      </p>
    </div>
  );
}
