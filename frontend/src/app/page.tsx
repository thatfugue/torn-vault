"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  Users,
  Calculator,
  ShieldCheck,
  Zap,
  BarChart3,
  ShieldAlert,
  Search,
  Target
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: Target,
    title: "OC Tactical Board",
    description: "Advanced OC 2.0 planning with strategic recommendations, automated block detection, and strategic assignment alerts.",
  },
  {
    icon: ShieldAlert,
    title: "Vault Intelligence",
    description: "Real-time asset tracking and abuse detection. Monitor Xanax usage, high-value asset hoarding, and export deep audit reports.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Dynamic Operative Health Scores based on log activity, status, and OC performance. Monitor crime trends and financial pulse.",
  },
  {
    icon: Zap,
    title: "War Intelligence",
    description: "Live chain monitoring with high-precision timers. Analyze combat performance with V2-integrated combat leaderboards.",
  },
  {
    icon: Search,
    title: "Global Intelligence Search",
    description: "Unified command palette (Ctrl+K) to find members, items, logs, and navigation tools instantly across the entire platform.",
  },
  {
    icon: Calculator,
    title: "Automated War Pay",
    description: "Precision payout calculation engine. Distribute faction funds fairly based on respect contribution and combat efficiency.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col font-sans">
      {}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

      {}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase">TornVault</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="bg-card border border-border px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-muted transition-all shadow-sm active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </header>

      {}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-40 pb-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Next-Gen Faction Intelligence Engine</span>
          </div>

          <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
            Dominance, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-orange-500">
              Quantified.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Equip your leadership with professional-grade analytics. TornVault provides real-time monitoring, strategic OC coordination, and deep-dive asset auditing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 text-base uppercase tracking-widest group"
              >
                Access Terminal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 rounded-2xl border-2 border-border font-black text-sm uppercase tracking-widest hover:bg-muted transition-all"
              >
                  Explore Intel
              </a>
          </div>
        </motion.div>
      </div>

      {}
      <div id="features" className="w-full bg-card/50 border-t border-border relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center mb-20">
              <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">Core Protocols</h2>
              <p className="text-4xl font-black tracking-tight text-foreground uppercase">Strategic Advantage Modules</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group flex flex-col p-8 rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-card-foreground mb-4 uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {}
      <footer className="py-12 text-center border-t border-border z-10 bg-background">
        <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-black text-sm uppercase tracking-widest">TornVault Intel</span>
        </div>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">© 2026 Designed for Elite Torn.com Factions.</p>
      </footer>
    </main>
  );
}
