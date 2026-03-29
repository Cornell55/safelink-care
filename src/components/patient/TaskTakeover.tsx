import { Clock, Check } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

interface TaskTakeoverProps {
  task: Task;
  onSnooze: () => void;
  onDone: () => void;
}

export function TaskTakeover({ task, onSnooze, onDone }: TaskTakeoverProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-patient-bg flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="text-center mb-12">
        <Clock className="w-16 h-16 text-patient-accent mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-patient-text mb-4">Time to:</h2>
        <p className="text-4xl font-bold text-patient-accent leading-tight">
          {task.description}
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={onDone}
          className="w-full py-6 rounded-2xl bg-success text-success-foreground text-2xl font-bold flex items-center justify-center gap-3"
        >
          <Check className="w-8 h-8" />
          DONE
        </button>
        <button
          onClick={onSnooze}
          className="w-full py-6 rounded-2xl bg-warning text-warning-foreground text-2xl font-bold flex items-center justify-center gap-3"
        >
          <Clock className="w-8 h-8" />
          SNOOZE (5 min)
        </button>
      </div>
    </div>
  );
}
