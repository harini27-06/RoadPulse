"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, User, ShieldCheck, HardHat, ArrowRight, Mail, Lock, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [role, setRole] = useState<"user" | "admin" | "executive_engineer">("user");
  const [district, setDistrict] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/engineers")
      .then(r => r.json())
      .then((data: { district: string }[]) => setDistricts(data.map(d => d.district)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); toast.error("Passwords do not match"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role, district: role === "executive_engineer" ? district : undefined }),
    });
    const data = await res.json() as { error?: string; role?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Signup failed"); toast.error(data.error ?? "Signup failed"); return; }
    toast.success("Account created! Welcome to RoadPulse 🎉");
    if (data.role === "admin") window.location.href = "/admin/dashboard";
    else if (data.role === "executive_engineer") window.location.href = "/executive-engineer/dashboard";
    else window.location.href = "/chatbot";
  };

  const roles = [
    { key: "user" as const, label: "Citizen", icon: User },
    { key: "admin" as const, label: "Admin", icon: ShieldCheck },
    { key: "executive_engineer" as const, label: "Exec. Engineer", icon: HardHat },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-5 shadow-lg shadow-emerald-500/30"
          >
            <UserCircle className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Join RoadPulse to report road issues</p>
        </div>

        <div className="glass-card p-8">
          {/* Role selector */}
          <div className="grid grid-cols-3 gap-1.5 mb-6 p-1 rounded-xl bg-muted/40 border border-blue-500/10">
            {roles.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-bold transition-all duration-200",
                  role === key
                    ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "executive_engineer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  className="w-full border border-blue-500/20 rounded-xl px-4 py-3 text-sm bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                >
                  <option value="">Select your district</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {[
              { key: "name", label: "Full Name", type: "text", placeholder: "John Doe", icon: User },
              { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com", icon: Mail },
            ].map(({ key, label, type, placeholder, icon: Icon }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-500/20 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            ))}

            {[
              { key: "password", label: "Password", placeholder: "Min. 6 characters" },
              { key: "confirm", label: "Confirm Password", placeholder: "Repeat password" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-blue-500/20 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground/50"
                  />
                  {key === "password" && (
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-400 font-bold transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
