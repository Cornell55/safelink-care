import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { EmergencyButton } from "@/components/patient/EmergencyButton";
import { TaskTakeover } from "@/components/patient/TaskTakeover";
import { SelfReminder } from "@/components/patient/SelfReminder";
import { MedicalInfo } from "@/components/patient/MedicalInfo";
import { FamilyContactsList } from "@/components/patient/FamilyContactsList";
import { SafeZoneAlert } from "@/components/patient/SafeZoneAlert";
import { useTasks } from "@/hooks/useTasks";
import { useAlarmSound } from "@/hooks/useAlarmSound";
import { useGeolocation, getDistanceMeters } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type SafeZone = Tables<"safe_zones">;

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { tasks, updateTaskStatus } = useTasks();
  const { position } = useGeolocation(true);
  const [activeReminder, setActiveReminder] = useState<Tables<"tasks"> | null>(null);
  const [nearbySafeZone, setNearbySafeZone] = useState<SafeZone | null>(null);
  const [dismissedZones, setDismissedZones] = useState<Set<string>>(new Set());
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);

  useAlarmSound(!!activeReminder);

  // Fetch safe zones
  useEffect(() => {
    supabase.from("safe_zones").select("*").then(({ data }) => {
      if (data) setSafeZones(data);
    });
  }, []);

  // Log GPS every 30 seconds
  useEffect(() => {
    if (!position) return;
    const interval = setInterval(() => {
      if (position) {
        supabase.from("gps_logs").insert({
          latitude: position.latitude,
          longitude: position.longitude,
        });
      }
    }, 30000);
    // Log immediately
    supabase.from("gps_logs").insert({
      latitude: position.latitude,
      longitude: position.longitude,
    });
    return () => clearInterval(interval);
  }, [position]);

  // Check for due tasks
  const checkDueTasks = useCallback(() => {
    if (activeReminder) return;
    const now = Date.now();
    const dueTask = tasks.find(
      (t) => t.status === "pending" && new Date(t.due_time).getTime() <= now
    );
    if (dueTask) setActiveReminder(dueTask);
  }, [tasks, activeReminder]);

  useEffect(() => {
    const interval = setInterval(checkDueTasks, 5000);
    checkDueTasks();
    return () => clearInterval(interval);
  }, [checkDueTasks]);

  // Safe zone proximity check
  useEffect(() => {
    if (!position || safeZones.length === 0) return;
    for (const zone of safeZones) {
      if (dismissedZones.has(zone.id)) continue;
      const dist = getDistanceMeters(position.latitude, position.longitude, zone.latitude, zone.longitude);
      if (dist < zone.threshold_meters) {
        setNearbySafeZone(zone);
        return;
      }
    }
    setNearbySafeZone(null);
  }, [position, safeZones, dismissedZones]);

  const handleSnooze = async () => {
    if (!activeReminder) return;
    await updateTaskStatus(activeReminder.id, "snoozed");
    setActiveReminder(null);
  };

  const handleDone = async () => {
    if (!activeReminder) return;
    await updateTaskStatus(activeReminder.id, "completed");
    setActiveReminder(null);
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen patient-theme pb-24">
      {/* Takeover */}
      {activeReminder && (
        <TaskTakeover task={activeReminder} onSnooze={handleSnooze} onDone={handleDone} />
      )}

      {/* Safe Zone Alert */}
      {nearbySafeZone && !activeReminder && (
        <SafeZoneAlert
          zoneName={nearbySafeZone.name}
          contactName={nearbySafeZone.contact_name || undefined}
          onGuideMe={() => {
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${nearbySafeZone.latitude},${nearbySafeZone.longitude}&travelmode=walking`,
              "_blank"
            );
          }}
          onDismiss={() => {
            setDismissedZones((prev) => new Set(prev).add(nearbySafeZone.id));
            setNearbySafeZone(null);
          }}
        />
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-patient-accent">
          <ArrowLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-patient-text">My Day</h1>
      </div>

      {/* Task List */}
      <div className="px-6 space-y-4">
        {pendingTasks.length === 0 && (
          <div className="text-center py-12 text-patient-fg opacity-60">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-xl font-semibold">All done for now!</p>
          </div>
        )}

        {pendingTasks.map((task) => (
          <div
            key={task.id}
            className="bg-patient-card rounded-2xl p-5 flex items-center gap-4"
          >
            <Clock className="w-8 h-8 text-patient-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-patient-text truncate">{task.description}</p>
              <p className="text-base text-patient-fg">
                {format(new Date(task.due_time), "h:mm a")}
              </p>
            </div>
          </div>
        ))}

        {completedTasks.length > 0 && (
          <div className="pt-4">
            <p className="text-sm font-semibold text-patient-fg opacity-50 uppercase mb-3">Completed</p>
            {completedTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="bg-patient-card/50 rounded-xl p-4 mb-2 flex items-center gap-3 opacity-60">
                <CheckCircle className="w-6 h-6 text-safezone flex-shrink-0" />
                <p className="text-lg text-patient-text line-through">{task.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Family Contacts */}
        <div className="pt-4">
          <FamilyContactsList />
        </div>

        {/* Medical Info */}
        <div className="pt-2">
          <MedicalInfo />
        </div>

        {/* Self Reminder */}
        <div className="pt-2">
          <SelfReminder />
        </div>
      </div>

      {/* Emergency Button */}
      <EmergencyButton />
    </div>
  );
}
