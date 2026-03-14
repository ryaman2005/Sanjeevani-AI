"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[hsl(280,67%,83%)] opacity-30 blur-[120px] animate-pulse-glow" />
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(340,90%,82%)] opacity-25 blur-[120px] animate-pulse-glow" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          SANJEEVANI
        </span>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Home</a>
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">About</a>
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Contact Us</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden md:inline text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Button asChild variant="default" className="rounded-full px-6 bg-black hover:bg-black/90 text-white">
            <Link href="/chat">
              Try model <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-32 max-w-4xl mx-auto">
        <p className="text-sm font-medium text-muted-foreground mb-4 tracking-wide uppercase">
          Meet SanjeevAI to <span className="text-primary font-semibold">Read more →</span>
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
          Your Intelligent Medical Assistant.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Sanjeevani AI helps you understand symptoms, get medical insights, and access health information instantly using advanced AI.
        </p>
        <div className="flex items-center gap-4">
          <Button asChild size="lg" variant="default" className="rounded-full px-8 bg-black hover:bg-black/90 text-white font-semibold">
            <Link href="/chat">Get started</Link>
          </Button>
          <Button variant="ghost" size="lg" className="text-foreground/70 font-medium">
            Learn more
          </Button>
        </div>
      </section>
    </div>
  );
}
