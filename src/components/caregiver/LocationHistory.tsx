import { useEffect, useState } from "react";
import { History, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type GpsLog = Tables<"gps_logs">;

export function LocationHistory() {
  const [logs, setLogs] = useState<GpsLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("gps_logs")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(15);
      if (!mounted) return;
      if (data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();

    const channel = supabase
      .channel("gps-history-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gps_logs" }, (payload) => {
        setLogs((prev) => [payload.new as GpsLog, ...prev].slice(0, 15));
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Location History</h2>
        <span className="ml-auto text-xs text-muted-foreground">{logs.length} recent</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading history...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No GPS history yet. Open the Patient Dashboard to start tracking.
        </p>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-3">
          {logs.map((log, idx) => {
            const mapsUrl = `https://www.google.com/maps?q=${log.latitude},${log.longitude}`;
            return (
              <li key={log.id} className="ml-4">
                <span
                  className={`absolute -left-1.5 w-3 h-3 rounded-full ring-2 ring-background ${
                    idx === 0 ? "bg-success" : "bg-muted-foreground"
                  }`}
                />
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                      {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.recorded_at), { addSuffix: true })}
                    </p>
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}