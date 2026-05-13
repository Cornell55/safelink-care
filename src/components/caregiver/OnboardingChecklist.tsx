import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Step {
  key: string;
  label: string;
  hint: string;
}

const STEPS: Step[] = [
  { key: "contact", label: "Add a family contact", hint: "So the patient can call someone with one tap." },
  { key: "medical", label: "Add medical info", hint: "Medications, allergies, conditions." },
  { key: "zone", label: "Set a safe zone", hint: "Get a nudge if your loved one nears home or a familiar place." },
  { key: "task", label: "Send the first reminder", hint: "Anything from “take pill” to “drink water.”" },
];

const DISMISS_KEY = "ll-onboarding-dismissed";

export function OnboardingChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [contacts, medical, zones, tasks] = await Promise.all([
        supabase.from("family_contacts").select("id", { count: "exact", head: true }),
        supabase.from("medical_records").select("id", { count: "exact", head: true }),
        supabase.from("safe_zones").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      setDone({
        contact: (contacts.count ?? 0) > 0,
        medical: (medical.count ?? 0) > 0,
        zone: (zones.count ?? 0) > 0,
        task: (tasks.count ?? 0) > 0,
      });
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const completed = STEPS.filter((s) => done[s.key]).length;
  const total = STEPS.length;

  if (dismissed || completed === total) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border-2 border-accent/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Get set up</h2>
        </div>
        <button
          onClick={() => { localStorage.setItem(DISMISS_KEY, "1"); setDismissed(true); }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Hide
        </button>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-3">{completed} of {total} done</p>

      <ul className="space-y-2">
        {STEPS.map((s) => (
          <li key={s.key} className="flex items-start gap-3">
            {done[s.key] ? (
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${done[s.key] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {s.label}
              </p>
              {!done[s.key] && (
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}