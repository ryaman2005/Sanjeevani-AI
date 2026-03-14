import type { PatientDemographics } from "@/types/chat";

interface Props {
  demographics: PatientDemographics;
  onChange: (d: PatientDemographics) => void;
}

export function PatientDemographicsForm({ demographics, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Patient Name</label>
        <input
          type="text"
          value={demographics.name}
          onChange={(e) => onChange({ ...demographics, name: e.target.value })}
          placeholder="Enter name"
          className="w-full h-11 rounded-xl bg-background border border-border/50 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-medical-green focus:ring-1 focus:ring-medical-green/50 transition-all shadow-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Age</label>
        <input
          type="number"
          value={demographics.age}
          onChange={(e) => onChange({ ...demographics, age: e.target.value })}
          placeholder="e.g. 45"
          className="w-full h-11 rounded-xl bg-background border border-border/50 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-medical-green focus:ring-1 focus:ring-medical-green/50 transition-all shadow-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Gender</label>
        <select
          value={demographics.gender}
          onChange={(e) => onChange({ ...demographics, gender: e.target.value })}
          className="w-full h-11 rounded-xl bg-background border border-border/50 px-4 text-sm text-foreground outline-none focus:border-medical-green focus:ring-1 focus:ring-medical-green/50 transition-all shadow-sm appearance-none"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );
}
