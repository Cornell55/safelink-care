import { useState, useEffect } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type MedicalRecord = Tables<"medical_records">;

export function MedicalInfo() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase.from("medical_records").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setRecords(data);
    });

    const channel = supabase
      .channel("patient-medical-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "medical_records" }, () => {
        supabase.from("medical_records").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          if (data) setRecords(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (records.length === 0) return null;

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      general: "General", medication: "💊 Medication", allergy: "⚠️ Allergy",
      condition: "🏥 Condition", "emergency-info": "🚨 Emergency Info",
    };
    return map[cat] || cat;
  };

  return (
    <div className="bg-patient-card rounded-2xl p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-patient-accent" />
          <span className="text-xl font-bold text-patient-text">My Medical Info</span>
        </div>
        {expanded ? <ChevronUp className="w-6 h-6 text-patient-fg" /> : <ChevronDown className="w-6 h-6 text-patient-fg" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-slide-up">
          {records.map((r) => (
            <div key={r.id} className="bg-patient-bg rounded-xl p-4">
              <p className="text-base font-bold text-patient-text">{r.title}</p>
              <p className="text-sm text-patient-accent mt-1">{categoryLabel(r.category)}</p>
              <p className="text-base text-patient-text mt-2 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
