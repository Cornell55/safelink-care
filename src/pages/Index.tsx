import { useNavigate } from "react-router-dom";
import { Heart, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
          Legacy<span className="text-primary">Link</span>
        </h1>
        <p className="text-muted-foreground text-lg">Care, connected.</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 animate-slide-up">
        <button
          onClick={() => navigate("/patient")}
          className="w-full py-8 rounded-2xl bg-patient-bg text-patient-text flex flex-col items-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Heart className="w-12 h-12 text-patient-accent" />
          <span className="text-2xl font-bold tracking-wide">I Am the Patient</span>
          <span className="text-sm opacity-70">My safe space</span>
        </button>

        <button
          onClick={() => navigate("/caregiver")}
          className="w-full py-8 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Shield className="w-12 h-12" />
          <span className="text-2xl font-bold tracking-wide">I Am the Caregiver</span>
          <span className="text-sm opacity-70">Command center</span>
        </button>
      </div>
    </div>
  );
};

export default Index;
