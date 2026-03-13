import React from 'react'

type DiagnosisData = {
  diagnoses: { name: string; confidence: number }[]
  severity: "Low" | "Medium" | "URGENT"
  advice: string
}

export function DiagnosisCard({ data }: { data: DiagnosisData }) {
  if (!data || !data.diagnoses) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm mt-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🤖</span> AI Preliminary Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Based on provided symptoms and images</p>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
          data.severity === 'URGENT' 
            ? 'border-destructive text-destructive bg-destructive/10 animate-pulse' 
            : data.severity === 'Medium'
              ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
              : 'border-primary text-primary bg-primary/10'
        }`}>
          {data.severity} PRIORITY
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Probable Conditions</h3>
        {data.diagnoses.map((dx, idx) => (
          <div key={idx} className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
            <span className="font-medium text-foreground">{dx.name}</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${idx === 0 ? 'bg-primary' : 'bg-primary/50'}`} 
                  style={{ width: `${dx.confidence}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-10 text-right">{dx.confidence}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-accent/50 rounded-lg p-4 mb-6 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <span>📋</span> Recommended Action
        </h3>
        <p className="text-sm text-foreground/80">{data.advice}</p>
      </div>

      <div className="flex gap-3">
        {data.severity === 'URGENT' && (
          <button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium py-2 rounded-md transition-colors">
            Refer to Remote Doctor
          </button>
        )}
        <button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 rounded-md transition-colors">
          Save Session Record
        </button>
      </div>
    </div>
  )
}
