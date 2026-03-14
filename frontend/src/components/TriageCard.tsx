import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ClipboardList, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TriageResult } from "@/types/chat";

interface TriageCardProps {
  triage: TriageResult;
  onSubmit: (selectedSymptoms: string[]) => void;
  disabled?: boolean;
}

export function TriageCard({ triage, onSubmit, disabled = false }: TriageCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = (question: string) => {
    if (disabled) return;
    const newSelected = new Set(selected);
    if (newSelected.has(question)) {
      newSelected.delete(question);
    } else {
      newSelected.add(question);
    }
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    if (disabled) return;
    onSubmit(Array.from(selected));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-card border border-border/80 rounded-2xl p-5 shadow-lg w-[400px] max-w-full space-y-4 transition-all ${disabled ? 'opacity-70 grayscale-[0.2]' : ''}`}
    >
      <div className="flex flex-col gap-1.5 border-b border-border/50 pb-3">
        <h3 className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-medical-green" />
          More Details Needed
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          To provide a highly accurate diagnosis, please check any of the following symptoms you are also experiencing.
        </p>
      </div>

      <div className="space-y-2">
        {triage.questions.map((question, idx) => {
          const isSelected = selected.has(question);
          return (
            <button
              key={idx}
              onClick={() => toggleSelection(question)}
              disabled={disabled}
              className={`w-full text-left px-3 py-2.5 rounded-xl border flex items-start gap-3 transition-colors ${
                isSelected 
                  ? 'bg-medical-green/10 border-medical-green/50 shadow-sm' 
                  : 'bg-background hover:bg-muted border-border/50'
              } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className={`mt-0.5 min-w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                isSelected ? 'bg-medical-green border-medical-green' : 'bg-background border-muted-foreground/30'
              }`}>
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
              <span className={`text-sm ${isSelected ? 'text-card-foreground font-medium' : 'text-muted-foreground'}`}>
                {question}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-2"
            onClick={handleSubmit}
            disabled={disabled}
        >
          {selected.size > 0 ? `Submit Responses (${selected.size})` : "None of the above"}
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
