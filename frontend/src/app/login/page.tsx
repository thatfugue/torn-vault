"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, ShieldAlert, ArrowRight, Activity } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedKey = localStorage.getItem("torn_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey) {
      setError("Please enter your Torn Limited Access API Key.");
      return;
    }

    try {
      await login(apiKey);
      localStorage.setItem("torn_api_key", apiKey);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login catch error:", err);
      if (!err.response) {
        setError("Network Error: Could not reach the server. Please check your internet connection or API URL configuration.");
      } else {
        setError(
          err.response?.data?.error || "Failed to login. Please check your API key."
        );
      }
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="border border-border rounded-2xl p-8 sm:p-10 bg-card/50 backdrop-blur-xl shadow-2xl flex flex-col items-center">

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20"
          >
            <Activity className="w-8 h-8 text-primary" />
          </motion.div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-card-foreground">
              TornVault
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Faction analytics & strategic tools.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="apiKey"
                className="text-sm font-semibold text-card-foreground flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Limited Access API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your 16-character key"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground text-base font-mono shadow-sm"
                  disabled={loading}
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-2 text-destructive text-sm mt-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-md flex justify-center items-center group ${
                loading ? "opacity-75 cursor-not-allowed" : "hover:shadow-primary/20 hover:shadow-lg"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Access Terminal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-muted-foreground border-t border-border w-full pt-6">
            <p>
              Your API key is stored locally and used strictly for read-only access (GET requests)
              in compliance with Torn TOS.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
