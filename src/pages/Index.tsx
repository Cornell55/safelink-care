import { useNavigate } from "react-router-dom";
import { Heart, Shield, MapPin, Bell, PhoneCall, Stethoscope, Siren, ShieldCheck } from "lucide-react";

const features = [
  { icon: MapPin, title: "Live location & safe zones", body: "30-second GPS pings, fallback alerts, and gentle nudges when the patient nears a familiar place." },
  { icon: Bell, title: "Full-screen reminders", body: "Tasks take over the screen with a synthesized alarm — hard to miss, easy to dismiss." },
  { icon: PhoneCall, title: "Family contacts", body: "Caregiver-curated list. One tap to call or get walking directions home." },
  { icon: Stethoscope, title: "Medical records", body: "Medications, allergies, and conditions always one tap away on the patient device." },
  { icon: Siren, title: "Emergency button", body: "A panic press fires a real-time alert to the caregiver dashboard with location." },
  { icon: ShieldCheck, title: "Remote check-in", body: "Caregiver can request a snapshot or audio clip if the patient stops responding." },
];

const faqs = [
  { q: "Who is LegacyLink for?", a: "Families caring for a loved one with dementia, Alzheimer's, or other cognitive conditions where everyday orientation and safety matter." },
  { q: "Does the patient need to be tech-savvy?", a: "No. The patient screen uses massive text, high-contrast colors, and a single takeover for any reminder. Most actions are one tap." },
  { q: "Is my data private?", a: "All data lives in your private LegacyLink backend. Location and medical info are visible only to the paired caregiver." },
  { q: "Does it work offline?", a: "The app installs to the home screen and the static UI works offline. Live location and reminders need a connection to sync." },
];

const Index = () => {
  const navigate = useNavigate();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Nav */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-xl font-bold tracking-tight">
          Legacy<span className="text-primary">Link</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <button onClick={() => navigate("/caregiver")} className="text-foreground font-medium">Open app</button>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="px-6 pt-8 pb-16 max-w-3xl mx-auto text-center animate-fade-in">
          <p className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
            For families living with dementia
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-tight">
            Keep your loved one safe.<br />
            <span className="text-primary">Stay one tap away.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            LegacyLink pairs a calm, high-contrast patient screen with a real-time caregiver dashboard. Live location, reminders, medical info, and emergency alerts — all in one connected app.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate("/patient")}
              className="py-5 rounded-2xl bg-patient-bg text-patient-text flex flex-col items-center gap-1 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Heart className="w-7 h-7 text-patient-accent" />
              <span className="text-base font-bold">I'm the Patient</span>
              <span className="text-xs opacity-70">My safe space</span>
            </button>
            <button
              onClick={() => navigate("/caregiver")}
              className="py-5 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center gap-1 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Shield className="w-7 h-7" />
              <span className="text-base font-bold">I'm the Caregiver</span>
              <span className="text-xs opacity-80">Command center</span>
            </button>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-16 bg-muted/40 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3">Everything a caregiver wishes they had</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              Built around real moments of confusion, wandering, and worry — not generic “family tracking.”
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-2xl p-5">
                  <f.icon className="w-6 h-6 text-primary mb-3" />
                  <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Common questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group bg-card border border-border rounded-xl p-5">
                <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 py-16 bg-primary text-primary-foreground text-center">
          <h2 className="text-3xl font-bold mb-3">Ready when you are.</h2>
          <p className="opacity-80 mb-6 max-w-md mx-auto">Open the patient screen on the loved one's phone, and the caregiver dashboard on yours.</p>
          <button
            onClick={() => navigate("/caregiver")}
            className="px-8 py-4 rounded-xl bg-primary-foreground text-primary font-semibold"
          >
            Open caregiver dashboard
          </button>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} LegacyLink — care, connected.
      </footer>
    </div>
  );
};

export default Index;
