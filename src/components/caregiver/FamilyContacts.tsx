import { useState, useEffect } from "react";
import { Users, Plus, MapPin, Phone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type FamilyContact = Tables<"family_contacts">;

export function FamilyContacts() {
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    supabase.from("family_contacts").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setContacts(data);
    });

    const channel = supabase
      .channel("family-contacts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "family_contacts" }, () => {
        supabase.from("family_contacts").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          if (data) setContacts(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = async () => {
    if (!name.trim() || !latitude || !longitude) {
      toast.error("Name, latitude, and longitude are required");
      return;
    }
    const { error } = await supabase.from("family_contacts").insert({
      name: name.trim(),
      phone: phone.trim() || null,
      relationship: relationship.trim() || null,
      address: address.trim() || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });
    if (error) { toast.error("Failed to add contact"); return; }
    toast.success("Contact added!");
    setName(""); setPhone(""); setRelationship(""); setAddress(""); setLatitude(""); setLongitude("");
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("family_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact removed");
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Family Contacts</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-lg bg-primary text-primary-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 space-y-3 animate-slide-up">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Relationship (e.g., Sister)"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address"
            className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
          <div className="grid grid-cols-2 gap-3">
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" type="number" step="any"
              className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" type="number" step="any"
              className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none text-sm placeholder:text-muted-foreground" />
          </div>
          <button onClick={handleAdd} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Add Contact
          </button>
        </div>
      )}

      <div className="space-y-2">
        {contacts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No contacts yet</p>}
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{c.name} {c.relationship && <span className="text-muted-foreground">({c.relationship})</span>}</p>
              {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
              {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
            </div>
            <button
              onClick={() => window.open(`https://www.google.com/maps?q=${c.latitude},${c.longitude}`, "_blank")}
              className="text-xs text-primary underline mr-2"
            >Map</button>
            <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-emergency">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
