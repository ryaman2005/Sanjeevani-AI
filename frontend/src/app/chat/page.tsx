"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatInput } from "@/components/ChatInput";
import { PatientDemographicsForm } from "@/components/PatientDemographicsForm";
import { DiagnosisCard } from "@/components/DiagnosisCard";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = async (content: string, file?: File) => {
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

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("symptoms", content);
      formData.append("age", demographics.age || "25");
      formData.append("gender", demographics.gender || "male");
      // Add worker_id for backend session tracking
      formData.append("worker_id", "00000000-0000-0000-0000-000000000000"); 
      if (file) formData.append("file", file);

      // Using the absolute URL for the backend
      const res = await fetch("http://localhost:8000/analyze/combined", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      const diagnosis: DiagnosisResult = {
        severity: data.severity || "Medium",
        diseases: data.diseases || data.top_diseases || [{ name: "Unknown", confidence: 0 }],
        advice: data.advice || data.medical_advice || "Please consult a healthcare professional.",
      };

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        diagnosis,
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s))
      );
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

  return (
    <div className="dark h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          sessions={sessions}
          activeId={activeSessionId}
          onNewChat={createNewChat}
          onSelect={setActiveSessionId}
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
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Hi! {demographics.name || "Guest"}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">What's on the agenda today?</p>
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
                    {msg.diagnosis ? (
                      <DiagnosisCard diagnosis={msg.diagnosis} />
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
        <div className="border-t border-border bg-background pt-4 pb-6 px-4 md:px-8">
            <div className="max-w-3xl mx-auto space-y-4">
                <PatientDemographicsForm demographics={demographics} onChange={setDemographics} />
                <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
        </div>
      </div>
    </div>
  );
}
