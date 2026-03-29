import { useState, useEffect } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { format } from "date-fns";

type MedicalRecord = Tables<"medical_records">;

const CATEGORIES = ["general", "medication", "allergy", "condition", "emergency-info"];

export function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  useEffect(() => {
    supabase.from("medical_records").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setRecords(data);
    });

    const channel = supabase
      .channel("medical-records-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "medical_records" }, () => {
        supabase.from("medical_records").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          if (data) setRecords(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    const { error } = await supabase.from("medical_records").insert({
      title: title.trim(),
      content: content.trim(),
      category,
    });
    if (error) { toast.error("Failed to add record"); return; }
    toast.success("Medical record added!");
    setTitle(""); setContent(""); setCategory("general");
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("medical_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success("Record removed");
  };

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      general: "General", medication: "Medication", allergy: "Allergy",
      condition: "Condition", "emergency-info": "Emergency Info",
    };
    return map[cat] || cat;
  };

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      medication: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      allergy: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      condition: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "emergency-info": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return map[cat] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Medical Records</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-lg bg-primary text-primary-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 space-y-3 animate-slide-up">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g., Daily Medications)"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Details..."
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground min-h-[100px] resize-none" />
          <button onClick={handleAdd} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Save Record
          </button>
        </div>
      )}

      <div className="space-y-2">
        {records.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No medical records yet</p>}
        {records.map((r) => (
          <div key={r.id} className="py-3 border-b border-border last:border-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor(r.category)}`}>
                    {categoryLabel(r.category)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-emergency mt-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
