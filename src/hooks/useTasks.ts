import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("due_time", { ascending: true });
    if (data) setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const addTask = async (description: string, dueTime: string) => {
    await supabase.from("tasks").insert({ description, due_time: dueTime });
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "completed") update.completed_at = new Date().toISOString();
    if (status === "snoozed") {
      const task = tasks.find((t) => t.id === id);
      const newDue = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      update.due_time = newDue;
      update.snooze_count = (task?.snooze_count || 0) + 1;
      update.status = "pending"; // reset to pending so it triggers again
    }
    await supabase.from("tasks").update(update).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  return { tasks, loading, addTask, updateTaskStatus, deleteTask, refetch: fetchTasks };
}
