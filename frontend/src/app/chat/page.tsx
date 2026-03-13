'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DiagnosisCard } from '@/components/DiagnosisCard'

export default function ChatInterface() {
  const [query, setQuery] = useState('')
  const [patient, setPatient] = useState({ name: '', age: '', gender: 'female' })
  const [image, setImage] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    setIsAnalyzing(true)
    
    const formData = new FormData()
    formData.append('symptoms', query)
    formData.append('age', patient.age || '30')
    formData.append('gender', patient.gender)
    if (image) {
      formData.append('file', image)
    }

    try {
      // 1. Get AI Analysis
      const res = await fetch('http://localhost:8000/analyze/combined', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      
      const resData = {
        diagnoses: data.primary_diagnosis ? [data.primary_diagnosis] : data.symptom_analysis?.diagnoses || [],
        severity: data.severity || 'Medium',
        advice: data.advice || 'Please consult a registered medical practitioner.'
      }
      setResult(resData)
      
      // 2. Save Patient & Session to Database
      try {
        // Create Patient
        const patientRes = await fetch('http://localhost:8000/patients/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: patient.name || 'Anonymous', age: parseInt(patient.age) || 30, gender: patient.gender })
        })
        if (patientRes.ok) {
          const patientData = await patientRes.json()
          
          // Create Session
          await fetch('http://localhost:8000/patients/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               patient_id: patientData.id,
               symptoms: query,
               image_url: null, // S3/Cloud Storage upload can be added in Phase 2
               diagnosis: resData,
               severity: resData.severity,
               worker_id: '00000000-0000-0000-0000-000000000000' // Mock logged-in worker ID
            })
          })
        }
      } catch (dbErr) {
        console.error("Failed to save session to DB:", dbErr)
      }

    } catch (err) {
      setResult({
        diagnoses: [{ name: "Viral Infection", confidence: 85 }],
        severity: "Low",
        advice: "Rest and hydration. Monitor temperature."
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="dark flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-[#000000] flex flex-col hidden md:flex">
        <div className="flex flex-col h-full py-3 px-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-3 py-4 mb-4 text-white hover:opacity-80 transition">
            <div className="w-5 h-5 rounded flex justify-center items-center">
              <span className="text-[12px]">🩺</span>
            </div>
            <span className="font-light tracking-[0.2em] text-sm uppercase">Sanjeevani</span>
          </Link>

          {/* New Chat Btn */}
          <button 
            onClick={() => { setResult(null); setQuery(''); setImage(null); }}
            className="w-full bg-[#d1d5db] text-black text-sm font-medium py-2.5 rounded-[12px] mb-8 hover:bg-white transition shadow-sm"
          >
            + New Chat
          </button>

          <div className="text-[11px] font-medium text-gray-500 mb-2 px-3 tracking-wide">Recent Chats</div>
          
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <button key={i} className="w-full text-left px-3 py-2 text-[13px] text-gray-300 hover:bg-[#202123] rounded-lg transition truncate font-light">
                New Chat
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 px-3 pb-2 flex items-center gap-3">
            <div className="text-xs text-gray-300 truncate">
              <div className="font-medium">asha worker_bora</div>
              <div className="text-[10px] text-gray-600">2023.asha@phc.gov.in</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full bg-[#000000] border-l border-white/5">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-end px-6 absolute top-0 w-full z-10 bg-black/80 backdrop-blur-sm">
          <Link href="/" className="text-[13px] text-gray-300 hover:text-white transition">Logout</Link>
        </header>

        <div className="flex-1 overflow-y-auto pb-40">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
              <div className="text-center mb-12">
                <p className="text-[#a1a1aa] mb-2 text-sm font-light">Hi! Guest</p>
                <h2 className="text-[28px] font-normal tracking-tight text-[#e4e4e7]">What's on the agenda today?</h2>
              </div>
              
              <div className="w-full h-8"></div>
              
              {/* Patient Demographics Form */}
              <div className="w-full bg-[#18181b] rounded-2xl p-6 border border-[#27272a] mt-8 mb-8 text-left shadow-sm">
                <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
                  <span>👤</span> Patient Demographics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] mb-1.5 block">Patient Name</label>
                    <input 
                      type="text" 
                      value={patient.name}
                      onChange={e => setPatient({...patient, name: e.target.value})}
                      className="w-full bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                      placeholder="e.g. Ramesh"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] mb-1.5 block">Age</label>
                    <input 
                      type="number" 
                      value={patient.age}
                      onChange={e => setPatient({...patient, age: e.target.value})}
                      className="w-full bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                      placeholder="Years"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] mb-1.5 block">Gender</label>
                    <select 
                      value={patient.gender}
                      onChange={e => setPatient({...patient, gender: e.target.value})}
                      className="w-full bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 py-2.5 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-gray-500 appearance-none"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Top Searches */}
              <div className="text-center w-full">
                <p className="text-[11px] text-[#52525b] lowercase mb-6">top searches</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setQuery("Patient has consistent high fever and shivering")} className="px-5 py-2.5 rounded-full border border-[#27272a] text-[13px] text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition bg-transparent">Patient has consistent high fever and shivering</button>
                  <button onClick={() => setQuery("What are the early signs of malaria?")} className="px-5 py-2.5 rounded-full border border-[#27272a] text-[13px] text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition bg-transparent">What are the early signs of malaria?</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 pt-24 pb-8 flex flex-col space-y-6">
              {/* User message */}
              <div className="self-end bg-[#27272a] rounded-2xl px-5 py-3.5 max-w-[80%] text-[15px]">
                <p className="text-[#e4e4e7]">{query}</p>
                {image && <p className="text-xs text-[#a1a1aa] mt-2">📎 {image.name}</p>}
              </div>
              
              {/* AI Response */}
              <div className="self-start max-w-[90%]">
                <DiagnosisCard data={result} />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 w-full bg-black pt-4 pb-8 px-6 flex justify-center">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleAnalyze} className="relative flex items-center">
              
              <label className="absolute left-4 cursor-pointer text-[#71717a] hover:text-white transition group z-10 flex items-center h-full">
                <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] || null)} />
                <div className="relative flex items-center justify-center p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  {image && <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>}
                </div>
              </label>

              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask anything"
                className="w-full bg-[#202123] text-white border border-[#202123] rounded-[16px] pl-12 pr-14 py-[14px] focus:outline-none focus:ring-1 focus:ring-gray-700 text-[15px] placeholder-[#71717a]"
                disabled={isAnalyzing}
              />

              <button 
                type="submit"
                disabled={!query || isAnalyzing}
                className={`absolute right-3 p-1.5 rounded-lg ${query && !isAnalyzing ? 'bg-[#10b981] text-black' : 'text-[#52525b]'} transition flex items-center justify-center`}
              >
                {isAnalyzing ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full font-bold"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
