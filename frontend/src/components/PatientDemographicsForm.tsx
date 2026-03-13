import type { PatientDemographics } from "@/types/chat";

interface Props {
  demographics: PatientDemographics;
  onChange: (d: PatientDemographics) => void;
}

export function PatientDemographicsForm({ demographics, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t border-border bg-card">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Patient Name</label>
        <input
          type="text"
          value={demographics.name}
          onChange={(e) => onChange({ ...demographics, name: e.target.value })}
          placeholder="Enter name"
          className="w-full h-9 rounded-md bg-secondary border border-border px-3 text-sm text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Age</label>
        <input
          type="number"
          value={demographics.age}
          onChange={(e) => onChange({ ...demographics, age: e.target.value })}
          placeholder="Age"
          className="w-full h-9 rounded-md bg-secondary border border-border px-3 text-sm text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Gender</label>
        <select
          value={demographics.gender}
          onChange={(e) => onChange({ ...demographics, gender: e.target.value })}
          className="w-full h-9 rounded-md bg-secondary border border-border px-3 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );
}
