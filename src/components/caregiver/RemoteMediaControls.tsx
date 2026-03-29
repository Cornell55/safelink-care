import { useState, useEffect } from "react";
import { Camera, Mic, Video, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaCapture {
  id: string;
  request_type: string;
  status: string;
  media_url: string | null;
  created_at: string;
}

export function RemoteMediaControls() {
  const [loading, setLoading] = useState<string | null>(null);
  const [latestCapture, setLatestCapture] = useState<MediaCapture | null>(null);

  // Listen for fulfilled requests
  useEffect(() => {
    const channel = supabase
      .channel("media-requests-caregiver")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "media_requests" },
        (payload) => {
          const updated = payload.new as MediaCapture;
          if (updated.status === "fulfilled" && updated.media_url) {
            setLatestCapture(updated);
            setLoading(null);
            toast.success("Media received from patient!");
          } else if (updated.status === "failed") {
            setLoading(null);
            toast.error("Patient could not capture media");
          }
        }
      )
      .subscribe();

    // Fetch latest fulfilled capture
    supabase
      .from("media_requests")
      .select("*")
      .eq("status", "fulfilled")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setLatestCapture(data[0] as MediaCapture);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const requestMedia = async (type: "photo" | "audio" | "live") => {
    setLoading(type);
    const { error } = await supabase.from("media_requests").insert({ request_type: type });
    if (error) {
      toast.error("Failed to send request");
      setLoading(null);
    } else {
      toast.info(`Requesting ${type} from patient device...`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => requestMedia("photo")}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          {loading === "photo" ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-primary" />
          )}
          <span className="text-xs font-medium text-foreground">Snapshot</span>
        </button>

        <button
          onClick={() => requestMedia("audio")}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          {loading === "audio" ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <Mic className="w-6 h-6 text-primary" />
          )}
          <span className="text-xs font-medium text-foreground">Listen</span>
        </button>

        <button
          onClick={() => requestMedia("live")}
          disabled={loading !== null}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          {loading === "live" ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <Video className="w-6 h-6 text-primary" />
          )}
          <span className="text-xs font-medium text-foreground">Live View</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for patient device response...</span>
        </div>
      )}

      {/* Latest Capture */}
      {latestCapture && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium uppercase">Latest Capture</p>
            <button
              onClick={() => requestMedia(latestCapture.request_type as "photo" | "audio" | "live")}
              className="text-xs text-primary flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {latestCapture.request_type === "audio" ? (
            <audio
              controls
              src={latestCapture.media_url!}
              className="w-full rounded-xl"
            />
          ) : (
            <img
              src={latestCapture.media_url!}
              alt="Patient camera capture"
              className="w-full rounded-xl border border-border object-cover max-h-64"
            />
          )}
        </div>
      )}
    </div>
  );
}
