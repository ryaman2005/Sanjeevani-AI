import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Info, ShieldAlert, Activity } from "lucide-react";
import type { DiagnosisResult } from "@/types/chat";

const severityConfig = {
  Urgent: { color: "bg-medical-urgent", textColor: "text-medical-urgent", icon: AlertTriangle },
  Medium: { color: "bg-medical-medium", textColor: "text-medical-medium", icon: AlertCircle },
  Low: { color: "bg-medical-low", textColor: "text-medical-low", icon: CheckCircle },
};

export function DiagnosisCard({ diagnosis }: { diagnosis: DiagnosisResult }) {
  const [language, setLanguage] = useState<"English" | "Hindi">("English");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedDiagnosis, setTranslatedDiagnosis] = useState<DiagnosisResult | null>(null);

  const handleTranslateToggle = async () => {
    if (language === "English") {
      setLanguage("Hindi");
      if (!translatedDiagnosis) {
        setIsTranslating(true);
        try {
          // Exclude top_conditions to save tokens/time if they are English proper nouns, but translating them is fine.
          // Let's translate the whole object except the severity flag.
          const payloadToTranslate = {
            top_conditions: diagnosis.top_conditions,
            explanation: diagnosis.explanation,
            precautions: diagnosis.precautions,
            what_to_do: diagnosis.what_to_do,
            emergency_signs: diagnosis.emergency_signs
          };

          const res = await fetch("http://localhost:8000/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: JSON.stringify(payloadToTranslate),
              language: "Hindi"
            })
          });

          if (res.ok) {
            const data = await res.json();
            const translatedParsed = JSON.parse(data.translated_text);
            setTranslatedDiagnosis({
              ...diagnosis, // keep original severity
              top_conditions: translatedParsed.top_conditions || diagnosis.top_conditions,
              explanation: translatedParsed.explanation || diagnosis.explanation,
              precautions: translatedParsed.precautions || diagnosis.precautions,
              what_to_do: translatedParsed.what_to_do || diagnosis.what_to_do,
              emergency_signs: translatedParsed.emergency_signs || diagnosis.emergency_signs
            });
          }
        } catch (error) {
          console.error("Translation failed:", error);
          // Revert on failure
          setLanguage("English"); 
        } finally {
          setIsTranslating(false);
        }
      }
    } else {
      setLanguage("English");
    }
  };

  const displayData = language === "Hindi" && translatedDiagnosis ? translatedDiagnosis : diagnosis;

  // Use Medium as fallback for severity since backend doesn't explicitly return it anymore
  const safeSeverity = (diagnosis.severity && diagnosis.severity in severityConfig) 
    ? diagnosis.severity 
    : "Medium";
    
  const config = severityConfig[safeSeverity as keyof typeof severityConfig];
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
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={handleTranslateToggle}
            disabled={isTranslating}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
              isTranslating 
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50" 
                : "border-border hover:bg-muted text-card-foreground"
            }`}
          >
            {isTranslating ? "Translating..." : (language === "English" ? "हिंदी" : "English")}
          </button>

          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} text-background`}>
            <Icon className="h-3 w-3" />
            {displayData.severity || diagnosis.severity || safeSeverity}
          </span>
        </div>
      </div>

      {isTranslating ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           <p className="text-sm text-muted-foreground animate-pulse">Translating to Hindi...</p>
        </div>
      ) : (
        <>
          {/* Disease Confidence */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Conditions</p>
            {displayData.top_conditions.map((d, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-card-foreground">{d.disease}</span>
                  <span className="text-muted-foreground font-mono text-xs">{d.probability}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.probability}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full bg-accent rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

          {/* Explanation */}
          {displayData.explanation && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info className="h-3 w-3" /> Explanation</p>
              <p className="text-sm text-card-foreground leading-relaxed">{displayData.explanation}</p>
            </div>
          )}

          {/* Recommended Actions vs Precautions Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-3">
            {displayData.what_to_do && displayData.what_to_do.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="h-3 w-3 text-blue-500" /> What To Do</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-card-foreground">
                  {displayData.what_to_do.map((action, i) => (
                    <li key={i} className="leading-relaxed">{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {displayData.precautions && displayData.precautions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShieldAlert className="h-3 w-3 text-amber-500" /> Precautions</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-card-foreground">
                  {displayData.precautions.map((precaution, i) => (
                    <li key={i} className="leading-relaxed">{precaution}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Emergency Signs */}
          {displayData.emergency_signs && displayData.emergency_signs.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mt-4">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Emergency Signs</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-400">
                {displayData.emergency_signs.map((sign, i) => (
                  <li key={i} className="leading-relaxed">{sign}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
