import { useState, useEffect } from "react";
import { StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type SelfReminder = Tables<"self_reminders">;

export function PatientNotes() {
  const [notes, setNotes] = useState<SelfReminder[]>([]);

  useEffect(() => {
    supabase.from("self_reminders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setNotes(data);
    });

    const channel = supabase
      .channel("patient-notes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "self_reminders" }, () => {
        supabase.from("self_reminders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          if (data) setNotes(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-5 h-5 text-secondary" />
        <h2 className="text-lg font-bold text-foreground">Patient's Quick Notes</h2>
      </div>

      <div className="space-y-2">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No notes from the patient yet</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="py-2 border-b border-border last:border-0">
            <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(note.created_at), "MMM d, h:mm a")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
