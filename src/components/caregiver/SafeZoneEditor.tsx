import { useEffect, useState } from "react";
import { Shield, Plus, Trash2, Crosshair, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type SafeZone = Tables<"safe_zones">;

export function SafeZoneEditor() {
  const [zones, setZones] = useState<SafeZone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("100");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("safe_zones")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setZones(data);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("safe-zones-editor")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "safe_zones" },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        toast.error(`Could not get location: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const resetForm = () => {
    setName(""); setContactName(""); setLat(""); setLng(""); setRadius("100");
    setShowForm(false);
  };

  const handleSave = async () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radNum = parseFloat(radius);
    if (!name.trim()) return toast.error("Name the safe zone");
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return toast.error("Set a valid location");
    if (Number.isNaN(radNum) || radNum < 10) return toast.error("Radius must be at least 10m");

    setSaving(true);
    const { error } = await supabase.from("safe_zones").insert({
      name: name.trim(),
      contact_name: contactName.trim() || null,
      latitude: latNum,
      longitude: lngNum,
      threshold_meters: radNum,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Safe zone activated");
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("safe_zones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Safe zone removed");
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-success" />
          <h2 className="text-lg font-bold text-foreground">Safe Zones</h2>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="p-2 rounded-lg bg-primary text-primary-foreground"
          aria-label="Add safe zone"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Active zones the patient device watches. Entering one shows a calming
        "You are safe" prompt; deleting deactivates it.
      </p>

      {showForm && (
        <div className="mb-4 space-y-3 animate-slide-up">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Zone name (e.g., Home)"
            maxLength={60}
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground"
          />
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Person at this place (optional, e.g., Mary)"
            maxLength={60}
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              inputMode="decimal"
              className="px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground"
            />
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              inputMode="decimal"
              className="px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="w-full py-2 rounded-xl bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            Use my current location
          </button>
          <div>
            <label className="text-xs text-muted-foreground">
              Trigger radius: {radius} m
            </label>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full accent-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
            >
              {saving ? "Activating…" : "Activate Safe Zone"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {zones.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No safe zones yet. Add one to activate detection.
          </p>
        )}
        {zones.map((z) => (
          <div key={z.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {z.name}{z.contact_name ? ` · ${z.contact_name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {z.latitude.toFixed(4)}, {z.longitude.toFixed(4)} · {z.threshold_meters}m
              </p>
            </div>
            <button
              onClick={() => handleDelete(z.id)}
              className="text-muted-foreground hover:text-emergency"
              aria-label={`Remove ${z.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}