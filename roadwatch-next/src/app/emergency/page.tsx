"use client";

import { Phone, MessageCircle, Shield, Flame, Ambulance, Car, AlertTriangle, Wrench, Info, Zap } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  {
    label: "Police",
    color: "blue",
    contacts: [
      { name: "Tamil Nadu Police", number: "100", desc: "General police emergency" },
      { name: "Traffic Police Control", number: "103", desc: "Traffic violations & accidents" },
      { name: "Highway Patrol", number: "1033", desc: "National highway emergencies" },
      { name: "Women Helpline", number: "1091", desc: "Women safety on roads" },
    ],
    icon: Shield,
  },
  {
    label: "Fire & Rescue",
    color: "red",
    contacts: [
      { name: "Fire Service", number: "101", desc: "Fire emergencies & rescue" },
      { name: "TN Fire & Rescue", number: "044-28591010", desc: "State fire department" },
    ],
    icon: Flame,
  },
  {
    label: "Medical",
    color: "green",
    contacts: [
      { name: "Ambulance", number: "108", desc: "Free emergency ambulance" },
      { name: "Road Accident Emergency", number: "1073", desc: "Accident victim assistance" },
      { name: "Disaster Management", number: "1077", desc: "Natural disaster & road collapse" },
    ],
    icon: Ambulance,
  },
  {
    label: "Road Safety",
    color: "yellow",
    contacts: [
      { name: "National Highway Helpline", number: "1033", desc: "NHAI road issues & SOS" },
      { name: "Road Transport Helpline", number: "14100", desc: "Transport complaints" },
      { name: "Motor Vehicle Dept.", number: "044-24321813", desc: "Vehicle & license issues" },
    ],
    icon: Car,
  },
  {
    label: "Road Repair & Civic",
    color: "orange",
    contacts: [
      { name: "Chennai Corporation", number: "1913", desc: "Road repair complaints" },
      { name: "TNRDC Helpline", number: "044-28270101", desc: "Tamil Nadu road development" },
      { name: "PWD Control Room", number: "044-25361526", desc: "Public works department" },
    ],
    icon: Wrench,
  },
  {
    label: "General Emergency",
    color: "purple",
    contacts: [
      { name: "National Emergency", number: "112", desc: "Single emergency number (all)" },
      { name: "Child Helpline", number: "1098", desc: "Child safety on roads" },
      { name: "Senior Citizen Helpline", number: "14567", desc: "Elder road safety assistance" },
    ],
    icon: AlertTriangle,
  },
];

const colorMap: Record<string, { gradient: string; text: string; border: string; badge: string; glow: string }> = {
  blue:   { gradient: "from-blue-600 to-blue-500",     text: "text-blue-500",   border: "border-blue-500/25",   badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",   glow: "hover:cyber-glow-blue" },
  red:    { gradient: "from-red-600 to-rose-500",       text: "text-red-500",    border: "border-red-500/25",    badge: "bg-red-500/10 text-red-600 dark:text-red-400",       glow: "hover:cyber-glow-red" },
  green:  { gradient: "from-emerald-600 to-green-500",  text: "text-emerald-500",border: "border-emerald-500/25",badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", glow: "hover:cyber-glow-green" },
  yellow: { gradient: "from-amber-500 to-yellow-500",   text: "text-amber-500",  border: "border-amber-500/25",  badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400", glow: "hover:cyber-glow-amber" },
  orange: { gradient: "from-orange-500 to-amber-500",   text: "text-orange-500", border: "border-orange-500/25", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400", glow: "hover:cyber-glow-amber" },
  purple: { gradient: "from-violet-600 to-purple-500",  text: "text-violet-500", border: "border-violet-500/25", badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400", glow: "hover:cyber-glow-blue" },
};

export default function EmergencyPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 px-4 py-1.5 rounded-full text-xs font-semibold">
          <Phone className="h-3.5 w-3.5" />
          Emergency Contacts
        </div>
        <h1 className="text-4xl font-black tracking-tight">Road Safety Helplines</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          Instant hotlines and emergency services dispatch. Tap to initiate call or message routing.
        </p>

        {/* SOS Banner */}
        <motion.div
          animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 8px rgba(239,68,68,0.1)", "0 0 0 0 rgba(239,68,68,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-4 rounded-2xl shadow-lg shadow-red-500/30 mx-auto"
        >
          <Zap className="h-6 w-6" />
          <div className="text-left">
            <div className="text-2xl font-black tracking-widest">112</div>
            <div className="text-xs opacity-80 font-semibold">National Emergency — All Services</div>
          </div>
          <a href="tel:112" className="ml-4 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-xs font-bold">
            CALL NOW
          </a>
        </motion.div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-slate-900/50 border border-border rounded-lg px-4 py-2 w-fit mx-auto">
          <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          Verify local dialing codes if outside Tamil Nadu.
        </div>
      </motion.div>

      {/* Categories */}
      <div className="space-y-10">
        {categories.map(({ label, color, contacts, icon: Icon }, ci) => {
          const c = colorMap[color];
          return (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-base tracking-wide">{label}</h2>
                  <p className="text-[11px] text-muted-foreground">&gt; {contacts.length} contact{contacts.length > 1 ? "s" : ""} available</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent ml-2" />
              </div>

              {/* Contact cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {contacts.map(({ name, number, desc }) => (
                  <motion.div
                    key={number}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className={`rounded-xl border ${c.border} bg-white/60 dark:bg-slate-950/60 backdrop-blur-md p-5 space-y-4 transition-all duration-300`}
                  >
                    <div className="space-y-1">
                      <p className="font-black text-sm text-foreground">{name}</p>
                      <p className="text-[11px] text-muted-foreground leading-normal">{desc}</p>
                    </div>

                    <div className={`text-3xl font-black tracking-widest ${c.text}`}>{number}</div>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${number}`}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black bg-gradient-to-r ${c.gradient} text-white shadow-md transition-all hover:opacity-90`}
                      >
                        <Phone className="h-3.5 w-3.5" /> CALL
                      </a>
                      <a
                        href={`sms:${number}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold bg-white/50 dark:bg-slate-900/50 border border-border text-muted-foreground hover:text-foreground transition-all"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> SMS
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-14">
        In life-threatening situations always dial <span className="font-black text-red-500">112</span> first.
      </p>
    </div>
  );
}
