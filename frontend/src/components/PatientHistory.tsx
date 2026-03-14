import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export interface HistoryRecord {
  id: string;
  created_at: string;
  symptoms: string;
  advice: string;
}

interface PatientHistoryProps {
  history: HistoryRecord[];
}

export function PatientHistory({ history }: PatientHistoryProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <Activity className="h-4 w-4 text-medical-green" />
        <h3 className="font-display text-sm font-semibold text-card-foreground">Recent Health Activity</h3>
      </div>
      
      <div className="space-y-3 pt-1">
        {history.map((record, index) => {
          const dateObj = new Date(record.created_at);
          const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          
          let snippet = record.symptoms || "Prescription uploaded";
          if (snippet.length > 35) snippet = snippet.substring(0, 35) + '...';

          return (
            <motion.div 
              key={record.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-medical-green mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
              <p className="text-sm text-foreground font-medium leading-tight">
                {dateStr} <span className="text-muted-foreground mx-1">—</span> <span className="text-muted-foreground font-normal">{snippet}</span>
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
