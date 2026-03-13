'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Worker Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage patient sessions and triage alerts.</p>
        </div>
        <Link 
          href="/chat"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition"
        >
          + New Patient Session
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Patients Today</h3>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="bg-card border border-destructive/20 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-destructive/80"></div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Urgent Referrals</h3>
          <p className="text-3xl font-bold text-destructive">3</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total AI Scans</h3>
          <p className="text-3xl font-bold">156</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
      
      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Loading recent patient records...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Symptoms / Notes</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{s.patients.name}</div>
                      <div className="text-xs text-muted-foreground">{s.patients.age} yrs</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{s.symptoms}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        s.severity === 'URGENT' 
                          ? 'border-destructive text-destructive bg-destructive/10' 
                          : s.severity === 'Medium'
                            ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                            : 'border-primary text-primary bg-primary/10'
                      }`}>
                        {s.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:underline font-medium">View Report</button>
                    </td>
                  </tr>
                ))}
                
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No recent patient sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
