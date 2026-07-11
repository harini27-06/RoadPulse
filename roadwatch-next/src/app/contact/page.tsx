"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, User, MessageSquare, Send, CheckCircle2, Loader2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) as { error?: string } : {};
      if (!res.ok) throw new Error(data.error ?? `Server error (${res.status})`);
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-blue-500/20 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder:text-muted-foreground/50";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Mail className="h-3.5 w-3.5" /> Contact Us
          </div>
          <h1 className="text-3xl font-black tracking-tight">Get in Touch</h1>
          <p className="text-muted-foreground mt-1.5 text-sm max-w-lg">
            Have a question, feedback, or need to report an issue? Send us a message and the admin team will respond directly to your email.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Info panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6 space-y-5">
              <h2 className="font-bold text-sm">Contact Information</h2>

              {[
                { icon: Mail, label: "Email", value: "admin@roadpulse.tn.gov.in" },
                { icon: Phone, label: "Helpline", value: "1800-XXX-XXXX" },
                { icon: MapPin, label: "Office", value: "PWD Complex, Chennai, Tamil Nadu" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 space-y-3">
              <h2 className="font-bold text-sm">Response Time</h2>
              <div className="space-y-2">
                {[
                  { label: "General Queries", time: "1–2 business days" },
                  { label: "Complaint Issues", time: "Within 24 hours" },
                  { label: "Urgent / Safety", time: "Same day" },
                ].map(({ label, time }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-3">
            <div className="glass-card p-8">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Message Sent!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We&apos;ve received your message and will reply to <span className="font-semibold text-foreground">{form.email}</span> shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="text-xs text-primary hover:underline mt-2"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={set("name")}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set("email")}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Issue with my complaint status"
                      value={form.subject}
                      onChange={set("subject")}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Describe your query or issue in detail..."
                      value={form.message}
                      onChange={set("message")}
                      required
                      className={cn(inputClass, "resize-none")}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? "Sending..." : "Send Message"}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
