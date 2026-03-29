import { useState } from "react";
import { MessageSquare, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SelfReminder() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const save = async () => {
    if (!text.trim()) return;
    await supabase.from("self_reminders").insert({ content: text.trim() });
    toast.success("Reminder saved!");
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-5 rounded-2xl bg-patient-card text-patient-text flex items-center justify-center gap-3 text-xl font-semibold"
      >
        <MessageSquare className="w-7 h-7 text-patient-accent" />
        Remember This
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-patient-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-patient-text">Quick Note</span>
        <button onClick={() => setOpen(false)}>
          <X className="w-6 h-6 text-patient-text opacity-60" />
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your reminder..."
        className="w-full bg-patient-bg text-patient-text rounded-xl p-4 text-lg min-h-[100px] resize-none border-none outline-none placeholder:text-patient-text/40"
      />
      <button
        onClick={save}
        className="mt-3 w-full py-4 rounded-xl bg-patient-accent text-patient-bg font-bold text-lg flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Save Reminder
      </button>
    </div>
  );
}
