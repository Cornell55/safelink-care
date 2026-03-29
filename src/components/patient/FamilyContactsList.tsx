import { useState, useEffect } from "react";
import { Users, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type FamilyContact = Tables<"family_contacts">;

export function FamilyContactsList() {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase.from("family_contacts").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setContacts(data);
    });
  }, []);

  if (contacts.length === 0) return null;

  return (
    <div className="bg-patient-card rounded-2xl p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-patient-accent" />
          <span className="text-xl font-bold text-patient-text">My Family</span>
        </div>
        {expanded ? <ChevronUp className="w-6 h-6 text-patient-fg" /> : <ChevronDown className="w-6 h-6 text-patient-fg" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-slide-up">
          {contacts.map((c) => (
            <div key={c.id} className="bg-patient-bg rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-patient-text">{c.name}</p>
                {c.relationship && <p className="text-base text-patient-fg">{c.relationship}</p>}
                {c.address && <p className="text-sm text-patient-fg mt-1">{c.address}</p>}
              </div>
              <div className="flex gap-2">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="p-3 rounded-xl bg-patient-accent text-patient-bg">
                    <Phone className="w-6 h-6" />
                  </a>
                )}
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}&travelmode=walking`, "_blank")}
                  className="p-3 rounded-xl bg-safezone text-patient-bg"
                >
                  <MapPin className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
