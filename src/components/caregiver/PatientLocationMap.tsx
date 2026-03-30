import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type GpsLog = Tables<"gps_logs">;
type FamilyContact = Tables<"family_contacts">;

export function PatientLocationMap() {
  const [latestGps, setLatestGps] = useState<GpsLog | null>(null);
  const [fallbackContact, setFallbackContact] = useState<FamilyContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      // Try GPS logs first
      const { data: gpsData } = await supabase
        .from("gps_logs")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (gpsData?.[0]) {
        setLatestGps(gpsData[0]);
      } else {
        // Fallback: show first family contact location so the map isn't empty
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

  // Determine what to display
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
