import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';

/**
 * STYLE PROPOSAL V3: THE "ETHEREAL FRAME"
 * 
 * Goal: Maximum air, precision framework, and vertical depth.
 * 
 * Techniques:
 * 1. Precision 1px Borders: High-intensity brand colors used only on lines.
 * 2. Top-Heavy Density: A technical, multi-layered nav stack.
 * 3. Bottom-Linear Shadows: Depth that pulls the eye downward.
 * 4. Ultra-Glass: High transparency (40%) with heavy blur (2xl).
 * 5. Architectural Accents: Using small + icons and grid lines to define space.
 */

export default function MockupHero() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] selection:bg-[var(--brand-primary-dim)] selection:text-[var(--brand-primary)] overflow-x-hidden">
      
      {/* 1. ARCHITECTURAL TOP BAR — High Density, Glassy */}
      <header className="sticky top-0 z-50 w-full">
        {/* Top utility layer */}
        <div className="bg-[var(--bg-surface)]/40 backdrop-blur-xl border-b border-[var(--border-subtle)] px-6 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-[number:var(--font-bold)] text-[var(--text-muted)] tracking-[0.2em] uppercase">Portugal / NIF Service</span>
            <div className="h-3 w-[1px] bg-[var(--border-subtle)]" />
            <span className="text-[10px] font-[number:var(--font-bold)] text-[var(--status-success)] flex items-center gap-1 uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-[var(--status-success)] animate-pulse" />
              System Online
            </span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-[number:var(--font-bold)] text-[var(--text-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--text-primary)] transition-colors">Support</span>
             <span className="text-[10px] font-[number:var(--font-bold)] text-[var(--text-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--text-primary)] transition-colors">API</span>
          </div>
        </div>
        
        {/* Main Nav Layer */}
        <div className="bg-[var(--bg-surface)]/60 backdrop-blur-2xl border-b border-[var(--brand-primary)]/20 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="h-8 w-8 border border-[var(--brand-primary)] rounded-sm flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500">
                <div className="h-4 w-4 bg-[var(--brand-primary)] -rotate-45 group-hover:-rotate-90 transition-transform duration-500" />
              </div>
              <span className="font-[number:var(--font-bold)] text-[length:var(--text-xl)] tracking-tighter text-[var(--text-primary)]">RemoteNIF</span>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              {['Pricing', 'Process', 'Compliance', 'Network'].map(link => (
                <a key={link} href="#" className="text-[length:var(--text-xs)] font-[number:var(--font-bold)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors uppercase tracking-[0.15em] relative py-1 group">
                  {link}
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[var(--brand-primary)] transition-all group-hover:w-full" />
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-[length:var(--text-xs)] font-[number:var(--font-bold)] text-[var(--text-primary)] uppercase tracking-widest hover:opacity-70 transition-opacity">Login</button>
            <Button className="h-10 px-6 bg-transparent border border-[var(--brand-primary)] text-[var(--brand-primary)] font-[number:var(--font-bold)] hover:bg-[var(--brand-primary)] hover:text-white transition-all rounded-none uppercase tracking-widest text-[10px]">
              Apply Now
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO — Clean, Framed, Floating */}
      <section className="relative py-24 px-6">
        {/* Background Grid — The "Framework" visual */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-subtle)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 -z-10" />
        
        {/* Soft Background Auras */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--brand-primary-dim)] rounded-full blur-[120px] opacity-30 -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-[var(--brand-secondary)]/10 rounded-full blur-[100px] opacity-20 -z-10" />

        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-[var(--brand-primary)]" />
                <span className="text-[10px] font-[number:var(--font-bold)] text-[var(--brand-primary)] uppercase tracking-[0.3em]">Official Portuguese Tax ID</span>
             </div>
             
             <h1 className="text-6xl md:text-8xl font-[number:var(--font-bold)] text-[var(--text-primary)] tracking-tighter leading-[0.9] max-w-4xl">
               The simplest path <br />
               to your <span className="italic font-[number:var(--font-normal)] text-[var(--text-secondary)]">Portuguese</span> identity.
             </h1>
             
             <div className="grid md:grid-cols-12 gap-12 pt-12 items-end">
                <div className="md:col-span-7">
                  <p className="text-[length:var(--text-xl)] text-[var(--text-secondary)] leading-relaxed font-[number:var(--font-normal)]">
                    Skip the embassy, avoid the bureaucracy. Our platform provides the digital framework for your Portuguese NIF and fiscal representation in record time.
                  </p>
                  <div className="flex gap-4 mt-10">
                    <Button className="h-14 px-10 bg-[var(--text-primary)] text-white rounded-none font-[number:var(--font-bold)] uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                      Begin Onboarding
                    </Button>
                    <div className="h-14 w-14 border border-[var(--border-default)] flex items-center justify-center hover:border-[var(--brand-primary)] transition-colors cursor-pointer group">
                      <ArrowRight className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
                
                {/* 3. PRECISION DATA CARD — Top Density, Bottom Shadow */}
                <div className="md:col-span-5">
                  <div className="relative group">
                    {/* The Linear Bottom Shadow */}
                    <div className="absolute -bottom-8 left-4 right-4 h-12 bg-black/5 blur-2xl rounded-full -z-10" />
                    
                    <div className="bg-[var(--bg-surface)]/60 backdrop-blur-2xl border border-[var(--brand-primary)]/30 p-1 shadow-[var(--shadow-sm)]">
                      {/* Top Density Header */}
                      <div className="bg-[var(--brand-primary)] px-4 py-2 flex justify-between items-center text-[var(--text-on-accent)]">
                        <span className="text-[9px] font-[number:var(--font-bold)] uppercase tracking-[0.2em]">Application Monitor</span>
                        <div className="flex gap-1">
                          <Plus className="h-3 w-3 opacity-50" />
                          <div className="h-3 w-3 border border-white/30" />
                        </div>
                      </div>
                      
                      {/* Technical Body */}
                      <div className="p-6 space-y-6">
                        <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-4">
                           <div className="space-y-1">
                              <p className="text-[9px] text-[var(--text-muted)] uppercase font-[number:var(--font-bold)] tracking-widest">Express Track</p>
                              <p className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] tracking-tighter">48h SLA</p>
                           </div>
                           <Zap className="h-8 w-8 text-[var(--brand-primary)] opacity-20" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className="text-[9px] text-[var(--text-muted)] uppercase font-[number:var(--font-bold)]">Queue Status</p>
                              <p className="text-[length:var(--text-sm)] font-[number:var(--font-bold)] text-[var(--status-success)]">PRIORITY 01</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] text-[var(--text-muted)] uppercase font-[number:var(--font-bold)]">Rep Ready</p>
                              <p className="text-[length:var(--text-sm)] font-[number:var(--font-bold)] text-[var(--text-primary)]">YES</p>
                           </div>
                        </div>
                        
                        <div className="pt-2">
                           <div className="h-1 w-full bg-[var(--bg-subtle)] overflow-hidden">
                              <div className="h-full w-2/3 bg-[var(--brand-primary)]" />
                           </div>
                           <div className="flex justify-between mt-2">
                              <span className="text-[8px] font-[number:var(--font-bold)] text-[var(--text-muted)] uppercase">Onboarding</span>
                              <span className="text-[8px] font-[number:var(--font-bold)] text-[var(--brand-primary)] uppercase tracking-widest">In Progress</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 4. THE FRAMEWORK GRID — Border Play and Transparency */}
      <section className="py-24 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/20 backdrop-blur-sm relative">
        <div className="absolute top-0 left-0 p-4 border-r border-b border-[var(--border-subtle)]">
           <Plus className="h-3 w-3 text-[var(--text-muted)]" />
        </div>
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
          {[
            { title: "Legal Precision", desc: "Every application is reviewed by Portuguese solicitors to guarantee finanças acceptance.", icon: ShieldCheck },
            { title: "Global Reach", desc: "We support over 140 nationalities with specialized templates for each legal jurisdiction.", icon: Globe },
            { title: "Digital Native", desc: "Built from the ground up for speed. No paper, no mail, no friction. Just code and law.", icon: Zap }
          ].map((item, i) => (
            <div key={i} className="p-12 group hover:bg-[var(--bg-surface)]/40 transition-colors relative overflow-hidden">
              {/* Animated Corner Accent */}
              <div className="absolute top-0 right-0 h-12 w-12 border-t border-r border-transparent group-hover:border-[var(--brand-primary)]/40 transition-all duration-500" />
              
              <div className="h-10 w-10 border border-[var(--border-subtle)] flex items-center justify-center mb-8 group-hover:border-[var(--brand-primary)] transition-colors">
                 <item.icon className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)]" />
              </div>
              <h3 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] mb-4 tracking-tight">{item.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[length:var(--text-sm)]">
                {item.desc}
              </p>
              <div className="mt-8 flex items-center gap-2 text-[length:var(--text-xs)] font-[number:var(--font-bold)] text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                System Specs <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
