import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Activity, AlertTriangle, Clock, CheckCircle, Trash2 } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientLocationMap, LocationStatusPill, useLocationStatus } from "@/components/caregiver/PatientLocationMap";
import { RemoteMediaControls } from "@/components/caregiver/RemoteMediaControls";
import { FamilyContacts } from "@/components/caregiver/FamilyContacts";
import { MedicalRecords } from "@/components/caregiver/MedicalRecords";
import { PatientNotes } from "@/components/caregiver/PatientNotes";

type EmergencyEvent = Tables<"emergency_events">;


export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const { tasks, addTask, deleteTask } = useTasks();
  const [description, setDescription] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const locationStatus = useLocationStatus();

  // Fetch emergencies
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("emergency_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setEmergencies(data);
    };
    fetch();

    const channel = supabase
      .channel("emergency-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_events" }, (payload) => {
        setEmergencies((prev) => [payload.new as EmergencyEvent, ...prev]);
        toast.error("🚨 Emergency alert from patient!", { duration: 10000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);


  const handleAddTask = async () => {
    if (!description.trim() || !dueTime) {
      toast.error("Please fill in both fields");
      return;
    }
    const dueDate = new Date();
    const [hours, minutes] = dueTime.split(":").map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
    if (dueDate.getTime() < Date.now()) {
      dueDate.setDate(dueDate.getDate() + 1);
    }
    await addTask(description.trim(), dueDate.toISOString());
    toast.success("Task sent to patient!");
    setDescription("");
    setDueTime("");
    setShowAddTask(false);
  };

  const snoozedCount = tasks.filter((t) => t.snooze_count > 0 && t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const panicCount = emergencies.filter((e) => !e.resolved).length;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="text-primary-foreground/80">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Command Center</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs opacity-70">Completed</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{snoozedCount}</p>
            <p className="text-xs opacity-70">Snoozed</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${panicCount > 0 ? "bg-emergency" : "bg-primary-foreground/10"}`}>
            <p className="text-2xl font-bold">{panicCount}</p>
            <p className="text-xs opacity-70">Alerts</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 mt-6">
        {/* Location Map — prominent */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border-2 border-primary/30">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">📍 Patient Location</h2>
            </div>
            <LocationStatusPill status={locationStatus} />
          </div>
          <PatientLocationMap />
        </div>

        {/* Remote Camera & Mic */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">🎥 Remote View</h2>
          </div>
          <RemoteMediaControls />
        </div>

        {/* Emergency Alerts */}
        {emergencies.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-emergency" />
              <h2 className="text-lg font-bold text-foreground">Emergency Alerts</h2>
            </div>
            {emergencies.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-2 h-2 rounded-full ${e.resolved ? "bg-success" : "bg-emergency"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{e.description || "Panic button pressed"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Task */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Task Manager</h2>
            </div>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="p-2 rounded-lg bg-primary text-primary-foreground"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {showAddTask && (
            <div className="mb-4 space-y-3 animate-slide-up">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description (e.g., Take a shower)"
                className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm"
              />
              <button
                onClick={handleAddTask}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                Push to Patient
              </button>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                {task.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-warning flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(task.due_time), "h:mm a")}
                    {task.snooze_count > 0 && ` · Snoozed ${task.snooze_count}x`}
                  </p>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-emergency">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Family Contacts */}
        <FamilyContacts />

        {/* Medical Records */}
        <MedicalRecords />

        {/* Patient Quick Notes */}
        <PatientNotes />

        {/* AI Insights Summary */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">Activity Summary</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ {completedCount} Tasks Completed</p>
            <p>⏰ {snoozedCount} Tasks Snoozed</p>
            <p>📋 {pendingCount} Tasks Pending</p>
            <p>{panicCount > 0 ? `🚨 ${panicCount} Unresolved Alerts` : "✅ No Panic Alerts"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
