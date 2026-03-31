import { useEffect, useState } from "react";
import { MapPin, Navigation, Clock3, LocateFixed } from "lucide-react";
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
          .order("created_at", { ascending: false })
          .limit(1);

        if (contacts?.[0]) setFallbackContact(contacts[0]);
      }

      setLoading(false);
    };

    fetchLatest();

    const channel = supabase
      .channel("gps-location-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gps_logs" }, (payload) => {
        setLatestGps(payload.new as GpsLog);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latitude = latestGps?.latitude ?? fallbackContact?.latitude ?? null;
  const longitude = latestGps?.longitude ?? fallbackContact?.longitude ?? null;
  const isLive = Boolean(latestGps);
  const hasCoordinates = latitude !== null && longitude !== null;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  if (loading) {
    return (
      <div className="h-64 rounded-xl border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Loading location data...
      </div>
    );
  }

  if (!hasCoordinates) {
    return (
      <div className="h-64 rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-3 px-4 text-center">
        <LocateFixed className="w-8 h-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">No location data yet</p>
          <p className="text-sm text-muted-foreground">
            Open the Patient Dashboard on the patient's device and allow location access to start live tracking.
          </p>
        </div>
      </div>
    );
  }

  // OpenStreetMap static tile preview (no JS map library needed)
  const zoom = 15;
  const tileX = Math.floor(((longitude! + 180) / 360) * Math.pow(2, zoom));
  const latRad = (latitude! * Math.PI) / 180;
  const tileY = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
  const staticMapUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

  return (
    <div className="space-y-3">
      {/* Static mini-map preview */}
      <button
        onClick={() => mapsUrl && window.open(mapsUrl, "_blank", "noopener,noreferrer")}
        className="relative w-full overflow-hidden rounded-2xl border border-border group cursor-pointer"
      >
        <img
          src={staticMapUrl}
          alt={`Map tile near ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
          className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg ring-4 ring-primary/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-xs text-foreground px-2 py-1 rounded-lg flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          Tap to open
        </div>
      </button>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">
                  {isLive ? "Patient location" : `${fallbackContact?.name ?? "Known"} location`}
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isLive ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                  {isLive ? "Live" : "Fallback"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground break-all">
                {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="w-3.5 h-3.5" />
                {isLive
                  ? `Last update ${format(new Date(latestGps!.recorded_at), "h:mm:ss a")}`
                  : "Showing fallback contact coordinates"}
              </div>
            </div>
          </div>

          {mapsUrl && (
            <button
              onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shrink-0"
            >
              <Navigation className="w-4 h-4" />
              Open map
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          {isLive
            ? "Live tracking is active. The mini-map updates when new GPS data arrives."
            : "Showing fallback coordinates. Open the Patient Dashboard to enable live tracking."}
        </p>
      </div>
    </div>
  );
}
