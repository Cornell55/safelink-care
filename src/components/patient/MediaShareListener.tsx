import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function MediaShareListener() {
  const streamRef = useRef<MediaStream | null>(null);

  const handleMediaRequest = useCallback(async (request: { id: string; request_type: string }) => {
    try {
      if (request.request_type === "photo") {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();

        // Wait a frame for the video to render
        await new Promise((r) => setTimeout(r, 500));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        stream.getTracks().forEach((t) => t.stop());

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
        );

        const fileName = `photo_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("media-captures")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("media-captures").getPublicUrl(fileName);

        await supabase
          .from("media_requests")
          .update({ status: "fulfilled", media_url: urlData.publicUrl, fulfilled_at: new Date().toISOString() })
          .eq("id", request.id);

        toast.info("📸 Photo shared with caregiver");
      } else if (request.request_type === "audio") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: "audio/webm" });
          const fileName = `audio_${Date.now()}.webm`;

          const { error: uploadError } = await supabase.storage
            .from("media-captures")
            .upload(fileName, blob, { contentType: "audio/webm" });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from("media-captures").getPublicUrl(fileName);

          await supabase
            .from("media_requests")
            .update({ status: "fulfilled", media_url: urlData.publicUrl, fulfilled_at: new Date().toISOString() })
            .eq("id", request.id);

          toast.info("🎙️ Audio shared with caregiver");
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 10000); // 10 second clip
        toast.info("🎙️ Recording 10s audio clip...");
      } else if (request.request_type === "live") {
        // Start live stream reference
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        // Capture a snapshot to confirm it's active
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
        await new Promise((r) => setTimeout(r, 500));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d")!.drawImage(video, 0, 0);

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
        );

        const fileName = `live_${Date.now()}.jpg`;
        await supabase.storage.from("media-captures").upload(fileName, blob, { contentType: "image/jpeg" });
        const { data: urlData } = supabase.storage.from("media-captures").getPublicUrl(fileName);

        await supabase
          .from("media_requests")
          .update({ status: "fulfilled", media_url: urlData.publicUrl, fulfilled_at: new Date().toISOString() })
          .eq("id", request.id);

        // Stop after 30 seconds
        setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }, 30000);

        toast.info("📹 Live view shared with caregiver (30s)");
      }
    } catch (err: any) {
      console.error("Media capture error:", err);
      await supabase
        .from("media_requests")
        .update({ status: "failed" })
        .eq("id", request.id);
      toast.error("Could not access camera/microphone");
    }
  }, []);

  useEffect(() => {
    // Listen for new media requests
    const channel = supabase
      .channel("media-requests-patient")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "media_requests" },
        (payload) => {
          const req = payload.new as { id: string; request_type: string; status: string };
          if (req.status === "requested") {
            handleMediaRequest(req);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [handleMediaRequest]);

  // This component is invisible — it just listens
  return null;
}
