"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatInput } from "@/components/ChatInput";
import { PatientDemographicsForm } from "@/components/PatientDemographicsForm";
import { DiagnosisCard } from "@/components/DiagnosisCard";
import { PrescriptionCard } from "@/components/PrescriptionCard";
import { TriageCard } from "@/components/TriageCard";
import type { HistoryRecord } from "@/components/PatientHistory";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ChatSession, PatientDemographics, DiagnosisResult } from "@/types/chat";

const SUGGESTIONS = [
  "I have fever",
  "what is the symptom of malaria?",
  "what is malaria?",
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<PatientDemographics>({ name: "", age: "", gender: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingTriage, setIsAwaitingTriage] = useState(false);
  const [patientHistory, setPatientHistory] = useState<HistoryRecord[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/patients/11111111-1111-1111-1111-111111111111/history");
      if (res.ok) {
        const data = await res.json();
        setPatientHistory(data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  const createNewChat = () => {
    const id = generateId();
    const newSession: ChatSession = { id, title: "New Chat", messages: [], createdAt: new Date() };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
  };

  const sendMessage = async (content: string, file?: File | { filename: string; file_size: number; file_type: string }) => {
    let sessionId = activeSessionId;
    if (!sessionId) {
      const id = generateId();
      const newSession: ChatSession = { id, title: content.slice(0, 30) || "New Chat", messages: [], createdAt: new Date() };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(id);
      sessionId = id;
    }

    const userMsg: ChatMessage = { id: generateId(), role: "user", content, timestamp: new Date() };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title: s.messages.length === 0 ? content.slice(0, 30) : s.title, messages: [...s.messages, userMsg] }
          : s
      )
    );

    executeTriageOrAnalysis(content, file, sessionId);
  };

  const executeTriageOrAnalysis = async (content: string, file: any, sessionId: string) => {
    setIsLoading(true);

    try {
      let res;
      let data;
      
      if (file && file instanceof File) {
        // Route directly to the vision endpoint if a file is attached
        const formData = new FormData();
        formData.append("file", file);
        
        res = await fetch("http://localhost:8000/analyze-prescription/", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        data = await res.json();
        
        const aiMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "I have analyzed the prescription you uploaded. Here are the details:",
          prescription: data,
          timestamp: new Date(),
        };
        
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s))
        );
      } else {
        // AI TRIAGE STEP: If no file, ask follow up questions first
        const res = await fetch("http://localhost:8000/analyze/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms: content, age: demographics.age || 25, gender: demographics.gender || "male" })
        });
  
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        data = await res.json();
  
        const aiMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "",
          triage: data,
          timestamp: new Date(),
        };
  
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s))
        );
        
        setIsAwaitingTriage(true);
      }

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ Could not reach the server. Please ensure the backend is running at localhost:8000. Error: ${err instanceof Error ? err.message : "Unknown"}`,
        timestamp: new Date(),
      };
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, errorMsg] } : s))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriageSubmit = async (selectedFollowUps: string[], messageId: string) => {
    setIsAwaitingTriage(false);
    if (!activeSessionId) return;
    
    // Find the original user message just before this triage card
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;
    const triageIndex = session.messages.findIndex(m => m.id === messageId);
    const originalSymptomMsg = session.messages.slice(0, triageIndex).reverse().find(m => m.role === 'user');
    
    const combinedSymptoms = selectedFollowUps.length > 0
      ? `${originalSymptomMsg?.content || ''}. Associated symptoms: ${selectedFollowUps.join(', ')}`
      : `${originalSymptomMsg?.content || ''}. No additional symptoms reported.`;

    setIsLoading(true);

    try {
        const formData = new FormData();
        formData.append("symptoms", combinedSymptoms);
        formData.append("age", demographics.age || "25");
        formData.append("gender", demographics.gender || "male");
        formData.append("worker_id", "00000000-0000-0000-0000-000000000000"); 

        const res = await fetch("http://localhost:8000/analyze/combined", {
          method: "POST",
          body: formData,
        });
  
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
  
        const diagnosis: DiagnosisResult = {
          severity: "Medium", 
          top_conditions: (data.symptom_analysis && data.symptom_analysis.top_conditions) || data.top_conditions || [{ disease: "Unknown", probability: 0 }],
          explanation: (data.symptom_analysis && data.symptom_analysis.explanation) || data.explanation || "No explanation provided.",
          precautions: (data.symptom_analysis && data.symptom_analysis.precautions) || data.precautions || [],
          what_to_do: (data.symptom_analysis && data.symptom_analysis.what_to_do) || data.what_to_do || [],
          emergency_signs: (data.symptom_analysis && data.symptom_analysis.emergency_signs) || data.emergency_signs || [],
        };
  
        const aiMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "",
          diagnosis,
          timestamp: new Date(),
        };
  
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s))
        );
        
        // Background refresh history
        fetchHistory();
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ Could not reach the server for final diagnosis. Error: ${err instanceof Error ? err.message : "Unknown"}`,
        timestamp: new Date(),
      };
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s))
      );
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="dark h-screen flex bg-background text-foreground relative overflow-hidden">
      {/* Ambient background glows for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-medical-green/5 blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] mix-blend-screen pointer-events-none" />

      {/* Sidebar */}
      <div className="hidden md:block z-10">
        <ChatSidebar
          sessions={sessions}
          activeId={activeSessionId}
          onNewChat={createNewChat}
          onSelect={setActiveSessionId}
          patientHistory={patientHistory}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border">
          <span className="font-display text-sm font-semibold text-foreground md:hidden">SANJEEVANI</span>
          <div className="flex-1" />
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Link>
          </Button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 z-10 relative">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-medical-green to-primary bg-clip-text text-transparent mb-3 tracking-tight">
                Hi! {demographics.name || "Guest"}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 font-medium">How can Sanjeevani assist you today?</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <p className="w-full text-xs text-muted-foreground mb-2 uppercase tracking-widest">top searches</p>
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(s)}
                    className="text-xs rounded-full border-border hover:bg-muted"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              <AnimatePresence>
                {activeSession.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.prescription ? (
                      <PrescriptionCard prescription={msg.prescription} />
                    ) : msg.diagnosis ? (
                      <DiagnosisCard diagnosis={msg.diagnosis} />
                    ) : msg.triage ? (
                      <TriageCard 
                        triage={msg.triage} 
                        onSubmit={(symptoms) => handleTriageSubmit(symptoms, msg.id)}
                        disabled={!isAwaitingTriage || activeSession.messages[activeSession.messages.length - 1].id !== msg.id}
                      />
                    ) : (
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Demographics + Input */}
        <div className="border-t border-border/50 bg-background/60 backdrop-blur-xl pt-4 pb-6 px-4 md:px-8 z-20 relative">
            <div className="max-w-3xl mx-auto space-y-5">
                <PatientDemographicsForm demographics={demographics} onChange={setDemographics} />
                <ChatInput onSend={sendMessage} isLoading={isLoading || isAwaitingTriage} />
            </div>
        </div>
      </div>
    </div>
  );
}
