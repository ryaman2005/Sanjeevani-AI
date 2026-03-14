'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Activity, AlertTriangle, FileText } from 'lucide-react'

// Types based on our backend Supabase schema
type PatientSession = {
  id: string
  patient_id: string
  symptoms: string
  severity: string
  created_at: string
  patients: {
    name: string
    age: number
  }
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<PatientSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('http://localhost:8000/patients/sessions?limit=10')
        if (res.ok) {
          const data = await res.json()
          setSessions(data)
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessions()
  }, [])

  return (
    <div className="dark min-h-screen bg-background text-foreground font-body">
      {/* Top Nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-display text-lg font-bold tracking-tight">SANJEEVANI DASHBOARD</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
             </div>
             <span className="text-xs font-medium text-muted-foreground hidden sm:inline">asha worker_bora</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Health Worker Console</h1>
            <p className="text-muted-foreground">Monitoring community health and AI-assisted triage sessions.</p>
          </div>
          <Button asChild variant="medical" size="lg" className="rounded-xl font-semibold">
            <Link href="/chat">+ New Patient Intake</Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6 transition-all hover:bg-secondary/20">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
               </div>
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Patients Today</h3>
            </div>
            <p className="text-4xl font-display font-black">12</p>
          </div>
          
          <div className="bg-card border border-medical-urgent/20 rounded-2xl p-6 transition-all hover:bg-medical-urgent/5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-medical-urgent opacity-40 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-lg bg-medical-urgent/10 text-medical-urgent">
                  <AlertTriangle className="h-5 w-5" />
               </div>
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Urgent Referrals</h3>
            </div>
            <p className="text-4xl font-display font-black text-medical-urgent">3</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 transition-all hover:bg-secondary/20">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Activity className="h-5 w-5" />
               </div>
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total AI Scans</h3>
            </div>
            <p className="text-4xl font-display font-black">156</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">Recent Clinic Sessions</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">View All</Button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 border border-dashed border-border rounded-2xl">
             <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
             <p className="text-muted-foreground font-medium">Synchronizing with medical database...</p>
          </div>
        ) : (
          <div className="bg-card/50 border border-border rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-[10px]">Patient</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-[10px]">Primary Symptoms</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-[10px]">AI Triage</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-[10px]">Record Date</th>
                    <th className="px-6 py-5 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{s.patients.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.patients.age} years • {s.patients.name.length % 2 === 0 ? 'Female' : 'Male'}</div>
                      </td>
                      <td className="px-6 py-5 max-w-sm">
                        <p className="text-muted-foreground line-clamp-1 italic">"{s.symptoms}"</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          s.severity === 'URGENT' 
                            ? 'border-medical-urgent text-medical-urgent bg-medical-urgent/10' 
                            : s.severity === 'Medium'
                              ? 'border-medical-medium text-medical-medium bg-medical-medium/10'
                              : 'border-medical-green text-medical-green bg-medical-green/10'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                             s.severity === 'URGENT' ? 'bg-medical-urgent' : s.severity === 'Medium' ? 'bg-medical-medium' : 'bg-medical-green'
                          } animate-pulse`}></span>
                          {s.severity}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-muted-foreground font-mono text-xs">
                        {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold text-xs transition-colors">
                           <FileText className="h-3.5 w-3.5" />
                           REPORT
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">
                        No clinical sessions found in the current cache.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
