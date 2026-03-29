import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function EmergencyButton() {
  const handleEmergency = async () => {
    await supabase.from("emergency_events").insert({
      event_type: "panic",
      description: "Patient pressed emergency button",
    });
    toast.error("Emergency alert sent to caregiver!", { duration: 5000 });
  };

  return (
    <button
      onClick={handleEmergency}
      className="fixed bottom-0 left-0 right-0 z-50 py-5 bg-emergency text-emergency-foreground flex items-center justify-center gap-3 animate-pulse-emergency"
    >
      <Phone className="w-8 h-8" />
      <span className="text-xl font-bold tracking-wider">EMERGENCY HELP</span>
    </button>
  );
}
