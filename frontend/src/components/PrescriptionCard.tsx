import { motion } from "framer-motion";
import { Stethoscope, Building2, Pill, ShieldAlert, FileText } from "lucide-react";
import type { PrescriptionResult } from "@/types/chat";

export function PrescriptionCard({ prescription }: { prescription: PrescriptionResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border/60 rounded-2xl p-5 shadow-lg w-[450px] max-w-full space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
        <h3 className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-medical-green" />
          Analyzed Prescription
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground mt-1">
          {prescription.doctor && (
            <span className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" /> Dr. {prescription.doctor.replace('Dr. ', '').replace('Dr ', '')}</span>
          )}
          {prescription.clinic && (
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {prescription.clinic}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {prescription.summary && (
        <div className="bg-medical-green/5 border border-medical-green/10 rounded-xl p-3">
          <p className="text-sm text-card-foreground leading-relaxed italic">"{prescription.summary}"</p>
        </div>
      )}

      {/* Medicines */}
      {prescription.medicines && prescription.medicines.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5 text-primary" /> Prescribed Medicines
          </p>
          <div className="space-y-2">
            {prescription.medicines.map((med, idx) => (
              <div key={idx} className="bg-background border border-border/50 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-sm text-card-foreground">{med.name}</span>
                  <span className="text-xs font-medium bg-secondary text-foreground px-2 py-0.5 rounded-full">{med.dosage}</span>
                </div>
                {med.instructions && (
                  <span className="text-xs text-muted-foreground">{med.instructions}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Precautions */}
      {prescription.precautions && prescription.precautions.length > 0 && (
        <div className="border-t border-border/50 pt-4">
           <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Key Precautions
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-card-foreground">
            {prescription.precautions.map((precaution, i) => (
              <li key={i} className="leading-relaxed text-muted-foreground">{precaution}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
