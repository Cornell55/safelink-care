import { MapPin, Navigation } from "lucide-react";

interface SafeZoneAlertProps {
  zoneName: string;
  contactName?: string;
  onGuideMe: () => void;
  onDismiss: () => void;
}

export function SafeZoneAlert({ zoneName, contactName, onGuideMe, onDismiss }: SafeZoneAlertProps) {
  return (
    <div className="fixed inset-0 z-[55] bg-patient-bg/95 flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="bg-patient-card rounded-3xl p-8 max-w-sm w-full text-center">
        <MapPin className="w-14 h-14 text-safezone mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-patient-text mb-2">You Are Safe!</h2>
        <p className="text-xl text-patient-fg mb-6">
          You are near <span className="text-patient-accent font-bold">{contactName || zoneName}</span>'s house.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onGuideMe}
            className="w-full py-4 rounded-xl bg-safezone text-success-foreground font-bold text-lg flex items-center justify-center gap-2"
          >
            <Navigation className="w-6 h-6" />
            Guide Me
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-xl bg-patient-bg text-patient-text font-semibold text-base"
          >
            Okay, Thanks
          </button>
        </div>
      </div>
    </div>
  );
}
