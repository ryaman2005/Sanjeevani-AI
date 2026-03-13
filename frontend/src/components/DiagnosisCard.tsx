import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import type { DiagnosisResult } from "@/types/chat";

const severityConfig = {
  Urgent: { color: "bg-medical-urgent", textColor: "text-medical-urgent", icon: AlertTriangle },
  Medium: { color: "bg-medical-medium", textColor: "text-medical-medium", icon: AlertCircle },
  Low: { color: "bg-medical-low", textColor: "text-medical-low", icon: CheckCircle },
};

export function DiagnosisCard({ diagnosis }: { diagnosis: DiagnosisResult }) {
  const config = severityConfig[diagnosis.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card border border-border rounded-lg p-5 max-w-lg w-full space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-card-foreground">AI Diagnosis</h3>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} text-background`}>
          <Icon className="h-3 w-3" />
          {diagnosis.severity}
        </span>
      </div>

      {/* Disease Confidence */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Conditions</p>
        {diagnosis.diseases.map((d) => (
          <div key={d.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-card-foreground">{d.name}</span>
              <span className="text-muted-foreground font-mono text-xs">{d.confidence}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.confidence}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full bg-accent rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Advice */}
      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Medical Advice</p>
        <p className="text-sm text-card-foreground leading-relaxed">{diagnosis.advice}</p>
      </div>
    </motion.div>
  );
}
