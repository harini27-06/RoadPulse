"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Shield, ArrowRight, CheckCircle2, MapPin, Activity,
  Brain, Newspaper, Users, Quote, Heart, Target,
  Globe, ChevronRight, Star,
  Camera, Zap, Leaf, Lightbulb, Sparkles,
  Building2, Phone,
  FileText, BarChart3, Mail, ChevronLeft,
  Search,
} from "lucide-react";

/* ── Data ── */

const howItWorks = [
  { step: "01", icon: Camera, title: "Report an Issue", desc: "Capture a photo or upload an image of the road issue, add the location, and provide a short description. Reporting takes only a few moments.", color: "from-blue-500 to-blue-600" },
  { step: "02", icon: Search, title: "Review & Register", desc: " Each report is reviewed and securely registered in the system with the necessary details, ensuring it reaches the appropriate highway authorities.", color: "from-emerald-500 to-emerald-600" },
  { step: "03", icon: MapPin, title: "Track Progress", desc: "Citizens can monitor the progress of their complaints through every stage—from submission and review to repair and completion.", color: "from-blue-500 to-emerald-500" },
  { step: "04", icon: CheckCircle2, title: "Resolution", desc: "Once the repair is completed, the complaint is marked as resolved, creating a transparent and accountable road maintenance process.", color: "from-emerald-500 to-teal-600" },
];

const FileTextIcon = FileText;
const BarChart3Icon = BarChart3;
const MailIcon = Mail;

const communityStats = [
  { value: "50+", label: "Complaints Filed", icon: FileTextIcon },
  { value: "10+", label: "Issues Resolved", icon: CheckCircle2 },
  { value: "50+", label: "Active Users", icon: Users },
  { value: "38", label: "Districts Covered", icon: Globe },
];

const newsUpdates = [
  { date: "Jul 5, 2026", title: "AI Road Monitoring Expands to 10 New Districts", tag: "Expansion", tagColor: "blue" },
  { date: "Jun 28, 2026", title: "Highway Repair Works Scheduled This Week", tag: "Maintainance", tagColor: "emerald" },
  { date: "Jun 15, 2026", title: "Citizen Participation Continues to Grow", tag: "Community", tagColor: "amber" },
  { date: "Jun 1, 2026", title: "Road Maintenance Drive Expanded to Additional Districts", tag: "Infrastructure", tagColor: "violet" },
  { date: "May 20, 2026", title: "Enhanced Complaint Tracking Now Available", tag: "Service Update", tagColor: "blue" },
  { date: "May 10, 2026", title: "Faster Resolution of Reported Road Issues", tag: "Public Service", tagColor: "emerald" },
];

const testimonials = [
  { name: "Dr. S. Rajendran", role: "Executive Engineer, TN Highways", text: "RoadPulse has transformed how we monitor road conditions. The AI detection accuracy is remarkable.", rating: 4.5 },
  { name: "K. Tom", role: "Citizen, Chennai", text: "I reported a pothole and it was fixed within 48 hours. The transparency is incredible!", rating: 4 },
  { name: "jim", role: "Citizen", text: "The analytics dashboard gives us real-time visibility into road infrastructure across the district.", rating: 5 },
  { name: "vinu", role: "Traffic Police, Madurai", text: "Accident response time has dropped significantly since we started using RoadPulse.", rating: 5 },
];

const aiTips = [
  "Drive cautiously in monsoon — waterlogging reduces braking efficiency by up to 40%.",
  "Report potholes early: a 2-inch deep pothole can cause tire damage at 60 km/h.",
  "Use our Safe Route Finder to avoid high-risk zones during night travel.",
  "Regular road maintenance can reduce accident rates by up to 30%.",
];

/* ── Inline SVG Components ── */

function _DELETED_RoadIllustration() {
  return (
    <svg viewBox="0 0 600 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="30%" stopColor="#1e3a5f" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="75%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sunRays" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0" />
          <stop offset="40%" stopColor="#fef08a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="roadReflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="glassBldg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="glassBldg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="glassBldg3" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.15" />
          <stop offset="60%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="carBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="carWhite" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="carGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="ambulanceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="busGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="glassCard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.92" />
          <stop offset="100%" stopColor="white" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="glassCardDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="glassCardAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#fffbeb" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="laserBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hologramRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="hologramOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="hologramBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowSoft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.2" />
        </filter>
        <filter id="shadowLg" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
        <filter id="shadowCard" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.15" />
        </filter>
        <filter id="blurFog" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <clipPath id="roadClip">
          <rect x="0" y="280" width="600" height="120" />
        </clipPath>
      </defs>
      <rect width="600" height="500" fill="url(#skyGrad)" rx="20" />
      <g opacity="0.6">
        {[50, 120, 200, 280, 350, 420, 500, 550, 80, 170, 320, 450, 530].map((x, i) => (
          <circle key={i} cx={x} cy={10 + (i * 7) % 40} r={0.5 + (i % 3) * 0.3} fill="white" opacity={0.3 + (i % 5) * 0.1} />
        ))}
      </g>
      <circle cx="500" cy="45" r="18" fill="#fef3c7" opacity="0.3" filter="url(#glowSoft)" />
      <circle cx="500" cy="45" r="14" fill="#fef3c7" opacity="0.5" />
      <circle cx="500" cy="45" r="10" fill="#fef3c7" opacity="0.7" />
      <polygon points="520,65 0,200 0,300" fill="url(#sunRays)" />
      <polygon points="520,65 200,400 400,400" fill="url(#sunRays)" opacity="0.5" />
      <rect x="0" y="180" width="600" height="200" fill="url(#fogGrad)" filter="url(#blurFog)" />
      <g>
        <rect x="20" y="120" width="45" height="160" fill="url(#glassBldg1)" rx="2" />
        <rect x="20" y="120" width="45" height="160" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3" rx="2" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map(row => [0, 1, 2].map(col => <rect key={`b1-${row}-${col}`} x={26 + col * 13} y={128 + row * 18} width="8" height="10" fill="#fef08a" rx="1" opacity={0.2 + Math.random() * 0.4} />))}
        <rect x="20" y="120" width="12" height="160" fill="url(#glassReflect)" />
      </g>
      <g>
        <rect x="72" y="80" width="55" height="200" fill="url(#glassBldg2)" rx="2" />
        <rect x="72" y="80" width="55" height="200" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" rx="2" />
        <rect x="97" y="65" width="5" height="18" fill="#64748b" rx="1" />
        <circle cx="99.5" cy="62" r="3" fill="#ef4444" opacity="0.7" filter="url(#glow)" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => [0, 1, 2, 3].map(col => <rect key={`b2-${row}-${col}`} x={78 + col * 12} y={88 + row * 18} width="7" height="10" fill="#fef08a" rx="1" opacity={0.15 + Math.random() * 0.35} />))}
        <rect x="72" y="80" width="14" height="200" fill="url(#glassReflect)" />
      </g>
      <g>
        <rect x="135" y="150" width="40" height="130" fill="url(#glassBldg3)" rx="2" />
        <rect x="135" y="150" width="40" height="130" stroke="#34d399" strokeWidth="0.5" opacity="0.3" rx="2" />
        {[0, 1, 2, 3, 4, 5, 6].map(row => [0, 1, 2].map(col => <rect key={`b3-${row}-${col}`} x={141 + col * 12} y={158 + row * 18} width="7" height="10" fill="#fef08a" rx="1" opacity={0.2 + Math.random() * 0.3} />))}
        <rect x="135" y="150" width="10" height="130" fill="url(#glassReflect)" />
      </g>
      <g>
        <rect x="182" y="130" width="35" height="150" fill="url(#glassBldg1)" rx="2" />
        <rect x="182" y="130" width="35" height="150" stroke="#818cf8" strokeWidth="0.5" opacity="0.3" rx="2" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map(row => [0, 1].map(col => <rect key={`b4-${row}-${col}`} x={188 + col * 14} y={138 + row * 18} width="9" height="10" fill="#c7d2fe" rx="1" opacity={0.2 + Math.random() * 0.3} />))}
        <rect x="182" y="130" width="8" height="150" fill="url(#glassReflect)" />
      </g>
      <g opacity="0.6">
        <rect x="540" y="100" width="40" height="180" fill="url(#glassBldg2)" rx="2" />
        <rect x="540" y="100" width="40" height="180" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" rx="2" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(row => [0, 1, 2].map(col => <rect key={`b5-${row}-${col}`} x={546 + col * 12} y={108 + row * 18} width="7" height="10" fill="#fef08a" rx="1" opacity={0.15 + Math.random() * 0.3} />))}
        <rect x="540" y="100" width="10" height="180" fill="url(#glassReflect)" />
      </g>
      <g opacity="0.5">
        <rect x="585" y="160" width="30" height="120" fill="url(#glassBldg3)" rx="2" />
        <rect x="585" y="160" width="30" height="120" stroke="#34d399" strokeWidth="0.5" opacity="0.3" rx="2" />
      </g>
      <g>
        <rect x="225" y="245" width="5" height="15" fill="#451a03" rx="2" />
        <ellipse cx="227" cy="232" rx="16" ry="20" fill="#065f46" opacity="0.8" />
        <ellipse cx="227" cy="228" rx="12" ry="14" fill="#047857" opacity="0.6" />
        <ellipse cx="227" cy="225" rx="8" ry="10" fill="#10b981" opacity="0.4" />
      </g>
      <g>
        <rect x="248" y="248" width="4" height="12" fill="#451a03" rx="2" />
        <ellipse cx="250" cy="238" rx="12" ry="15" fill="#065f46" opacity="0.7" />
        <ellipse cx="250" cy="235" rx="9" ry="11" fill="#047857" opacity="0.5" />
      </g>
      <g>
        <rect x="340" y="245" width="5" height="15" fill="#451a03" rx="2" />
        <ellipse cx="342" cy="232" rx="16" ry="20" fill="#065f46" opacity="0.8" />
        <ellipse cx="342" cy="228" rx="12" ry="14" fill="#047857" opacity="0.6" />
        <ellipse cx="342" cy="225" rx="8" ry="10" fill="#10b981" opacity="0.4" />
      </g>
      <g>
        <rect x="363" y="248" width="4" height="12" fill="#451a03" rx="2" />
        <ellipse cx="365" cy="238" rx="12" ry="15" fill="#065f46" opacity="0.7" />
        <ellipse cx="365" cy="235" rx="9" ry="11" fill="#047857" opacity="0.5" />
      </g>
      <g>
        <rect x="410" y="250" width="4" height="10" fill="#451a03" rx="2" />
        <ellipse cx="412" cy="240" rx="10" ry="13" fill="#065f46" opacity="0.6" />
        <ellipse cx="412" cy="237" rx="7" ry="9" fill="#047857" opacity="0.4" />
      </g>
      <g opacity="0.6">
        <ellipse cx="30" cy="278" rx="20" ry="6" fill="#065f46" />
        <ellipse cx="60" cy="278" rx="18" ry="5" fill="#047857" />
        <ellipse cx="90" cy="278" rx="22" ry="6" fill="#065f46" />
        <ellipse cx="200" cy="278" rx="15" ry="4" fill="#047857" />
        <ellipse cx="300" cy="278" rx="18" ry="5" fill="#065f46" />
        <ellipse cx="380" cy="278" rx="20" ry="6" fill="#047857" />
        <ellipse cx="500" cy="278" rx="22" ry="6" fill="#065f46" />
        <ellipse cx="560" cy="278" rx="18" ry="5" fill="#047857" />
      </g>
      <rect x="0" y="280" width="600" height="120" fill="url(#roadGrad)" />
      <rect x="0" y="280" width="600" height="120" fill="url(#roadReflect)" />
      <line x1="0" y1="285" x2="600" y2="285" stroke="#fbbf24" strokeWidth="2" opacity="0.4" />
      <line x1="0" y1="395" x2="600" y2="395" stroke="#fbbf24" strokeWidth="2" opacity="0.4" />
      <g opacity="0.5">
        <rect x="30" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="120" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="210" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="300" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="390" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="480" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="570" y="335" width="30" height="3" fill="#fbbf24" rx="1.5" />
      </g>
      <g opacity="0.3">
        <rect x="160" y="335" width="8" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="175" y="335" width="5" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="350" y="335" width="6" height="3" fill="#fbbf24" rx="1.5" />
        <rect x="362" y="335" width="4" height="3" fill="#fbbf24" rx="1.5" />
      </g>
      <g opacity="0.5">
        <circle cx="50" cy="310" r="2" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="150" cy="310" r="2" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="250" cy="310" r="2" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="350" cy="310" r="2" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="450" cy="310" r="2" fill="#3b82f6" filter="url(#glow)" />
        <circle cx="550" cy="310" r="2" fill="#3b82f6" filter="url(#glow)" />
      </g>
      <ellipse cx="330" cy="355" rx="10" ry="5" fill="#0f172a" opacity="0.7" />
      <ellipse cx="330" cy="355" rx="8" ry="4" fill="#020617" opacity="0.5" />
      <ellipse cx="330" cy="355" rx="10" ry="5" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M260 365 Q265 360 268 363 Q272 357 276 361 Q280 355 284 359" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M276 361 Q280 365 283 362" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" />
      <ellipse cx="490" cy="370" rx="12" ry="6" fill="#3b82f6" opacity="0.15" />
      <ellipse cx="490" cy="370" rx="10" ry="5" fill="#3b82f6" opacity="0.1" />
      <ellipse cx="490" cy="370" rx="12" ry="6" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.4" />
      <g opacity="0.6">
        <rect x="80" y="360" width="25" height="4" fill="#78350f" rx="2" transform="rotate(-15 80 360)" />
        <ellipse cx="95" cy="358" rx="6" ry="4" fill="#065f46" transform="rotate(-15 95 358)" />
        <ellipse cx="88" cy="362" rx="5" ry="3" fill="#047857" transform="rotate(-15 88 362)" />
      </g>
      <g>
        <rect x="230" y="210" width="3" height="75" fill="#475569" rx="1.5" />
        <rect x="222" y="208" width="19" height="5" rx="2.5" fill="#334155" />
        <rect x="222" y="208" width="19" height="5" rx="2.5" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
        <ellipse cx="231" cy="213" rx="6" ry="2" fill="#fef08a" opacity="0.3" filter="url(#glow)" />
        <ellipse cx="231" cy="213" rx="3" ry="1.5" fill="#fef08a" opacity="0.5" />
      </g>
      <g>
        <rect x="380" y="215" width="3" height="70" fill="#475569" rx="1.5" />
        <rect x="372" y="213" width="19" height="5" rx="2.5" fill="#334155" />
        <ellipse cx="381" cy="218" rx="6" ry="2" fill="#fef08a" opacity="0.3" filter="url(#glow)" />
        <ellipse cx="381" cy="218" rx="3" ry="1.5" fill="#fef08a" opacity="0.5" />
      </g>
      <g>
        <rect x="300" y="195" width="3" height="90" fill="#475569" rx="1.5" />
        <rect x="280" y="190" width="45" height="20" rx="4" fill="#0f172a" />
        <rect x="280" y="190" width="45" height="20" rx="4" stroke="#3b82f6" strokeWidth="0.5" opacity="0.5" />
        <text x="285" y="200" fontSize="5" fill="#3b82f6" fontWeight="bold">SPEED 60</text>
        <text x="285" y="207" fontSize="4" fill="#22c55e">AI MONITORED</text>
        <rect x="280" y="190" width="45" height="20" rx="4" fill="#3b82f6" opacity="0.05" filter="url(#glow)" />
      </g>
      <g>
        <rect x="12" y="200" width="4" height="85" fill="#475569" rx="2" />
        <rect x="5" y="197" width="18" height="10" rx="3" fill="#334155" />
        <rect x="5" y="197" width="18" height="10" rx="3" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
        <rect x="7" y="199" width="6" height="5" rx="1" fill="#0f172a" />
        <circle cx="10" cy="201.5" r="2" fill="#3b82f6" filter="url(#glow)" />
        <polygon points="23,202 60,290 60,350" fill="url(#laserBeam)" />
        <line x1="23" y1="202" x2="60" y2="320" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
        <line x1="23" y1="202" x2="60" y2="340" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2" />
        <path d="M23 202 L55 290" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" strokeDasharray="2 3" />
        <path d="M23 202 L55 350" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" strokeDasharray="2 3" />
      </g>
      <g>
        <rect x="580" y="190" width="4" height="95" fill="#475569" rx="2" />
        <rect x="573" y="187" width="18" height="10" rx="3" fill="#334155" />
        <rect x="573" y="187" width="18" height="10" rx="3" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
        <rect x="575" y="189" width="6" height="5" rx="1" fill="#0f172a" />
        <circle cx="578" cy="191.5" r="2" fill="#3b82f6" filter="url(#glow)" />
        <polygon points="573,192 540,290 540,350" fill="url(#laserBeam)" />
        <line x1="573" y1="192" x2="540" y2="320" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
      </g>
      <g>
        <ellipse cx="460" cy="90" rx="10" ry="5" fill="#334155" />
        <ellipse cx="460" cy="90" rx="10" ry="5" stroke="#3b82f6" strokeWidth="0.3" opacity="0.5" />
        <line x1="450" y1="90" x2="440" y2="84" stroke="#475569" strokeWidth="1.5" />
        <line x1="450" y1="90" x2="440" y2="96" stroke="#475569" strokeWidth="1.5" />
        <line x1="470" y1="90" x2="480" y2="84" stroke="#475569" strokeWidth="1.5" />
        <line x1="470" y1="90" x2="480" y2="96" stroke="#475569" strokeWidth="1.5" />
        <ellipse cx="438" cy="84" rx="7" ry="2" fill="#64748b" opacity="0.4" />
        <ellipse cx="438" cy="96" rx="7" ry="2" fill="#64748b" opacity="0.4" />
        <ellipse cx="482" cy="84" rx="7" ry="2" fill="#64748b" opacity="0.4" />
        <ellipse cx="482" cy="96" rx="7" ry="2" fill="#64748b" opacity="0.4" />
        <circle cx="460" cy="93" r="2.5" fill="#3b82f6" filter="url(#glow)" />
        <polygon points="460,95 420,200 500,200" fill="url(#laserBeam)" opacity="0.3" />
        <line x1="460" y1="95" x2="440" y2="200" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2" />
        <line x1="460" y1="95" x2="480" y2="200" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2" />
        <line x1="460" y1="85" x2="460" y2="72" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />
        <circle cx="460" cy="70" r="1.5" fill="#3b82f6" opacity="0.5" filter="url(#glow)" />
        <circle cx="460" cy="65" r="1" fill="#3b82f6" opacity="0.3" filter="url(#glow)" />
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="320" cy="325" rx="35" ry="4" fill="#0f172a" opacity="0.2" />
        <rect x="290" y="300" width="60" height="20" rx="7" fill="url(#carBlue)" />
        <path d="M298 300 L305 290 L335 290 L342 300 Z" fill="#2563eb" />
        <path d="M300 300 L306 292 L318 292 L318 300 Z" fill="#1e3a5f" opacity="0.5" />
        <path d="M322 300 L322 292 L333 292 L339 300 Z" fill="#1e3a5f" opacity="0.4" />
        <ellipse cx="350" cy="308" rx="3" ry="2" fill="#fef08a" opacity="0.7" filter="url(#glow)" />
        <rect x="290" y="305" width="3" height="4" rx="1" fill="#ef4444" opacity="0.6" />
        <circle cx="305" cy="322" r="6" fill="#0f172a" />
        <circle cx="305" cy="322" r="2.5" fill="#475569" />
        <circle cx="335" cy="322" r="6" fill="#0f172a" />
        <circle cx="335" cy="322" r="2.5" fill="#475569" />
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="180" cy="370" rx="38" ry="4" fill="#0f172a" opacity="0.2" />
        <rect x="145" y="348" width="70" height="22" rx="8" fill="url(#carWhite)" />
        <path d="M155 348 L162 338 L198 338 L205 348 Z" fill="#e2e8f0" />
        <path d="M200 348 L195 340 L183 340 L183 348 Z" fill="#1e3a5f" opacity="0.4" />
        <path d="M178 348 L178 340 L164 340 L158 348 Z" fill="#1e3a5f" opacity="0.3" />
        <ellipse cx="145" cy="356" rx="3" ry="2" fill="#fef08a" opacity="0.7" filter="url(#glow)" />
        <rect x="212" y="353" width="3" height="4" rx="1" fill="#ef4444" opacity="0.6" />
        <circle cx="162" cy="372" r="6" fill="#0f172a" />
        <circle cx="162" cy="372" r="2.5" fill="#475569" />
        <circle cx="198" cy="372" r="6" fill="#0f172a" />
        <circle cx="198" cy="372" r="2.5" fill="#475569" />
      </g>
      <g filter="url(#shadow)" opacity="0.8">
        <ellipse cx="120" cy="315" rx="28" ry="3" fill="#0f172a" opacity="0.15" />
        <rect x="95" y="295" width="50" height="16" rx="6" fill="url(#carGreen)" />
        <path d="M102 295 L107 287 L133 287 L138 295 Z" fill="#16a34a" />
        <path d="M104 295 L108 289 L118 289 L118 295 Z" fill="#1e3a5f" opacity="0.4" />
        <path d="M120 295 L120 289 L131 289 L136 295 Z" fill="#1e3a5f" opacity="0.3" />
        <ellipse cx="145" cy="303" rx="2.5" ry="1.5" fill="#fef08a" opacity="0.6" filter="url(#glow)" />
        <circle cx="108" cy="313" r="5" fill="#0f172a" />
        <circle cx="108" cy="313" r="2" fill="#475569" />
        <circle cx="132" cy="313" r="5" fill="#0f172a" />
        <circle cx="132" cy="313" r="2" fill="#475569" />
      </g>
      <g filter="url(#shadow)" opacity="0.75">
        <ellipse cx="440" cy="378" rx="40" ry="4" fill="#0f172a" opacity="0.2" />
        <rect x="405" y="355" width="70" height="24" rx="6" fill="url(#busGrad)" />
        <rect x="405" y="355" width="70" height="24" rx="6" stroke="#0284c7" strokeWidth="0.5" opacity="0.3" />
        <rect x="412" y="358" width="8" height="8" rx="1" fill="#1e3a5f" opacity="0.5" />
        <rect x="424" y="358" width="8" height="8" rx="1" fill="#1e3a5f" opacity="0.5" />
        <rect x="436" y="358" width="8" height="8" rx="1" fill="#1e3a5f" opacity="0.5" />
        <rect x="448" y="358" width="8" height="8" rx="1" fill="#1e3a5f" opacity="0.5" />
        <rect x="460" y="358" width="8" height="8" rx="1" fill="#1e3a5f" opacity="0.5" />
        <ellipse cx="405" cy="365" rx="2.5" ry="2" fill="#fef08a" opacity="0.6" filter="url(#glow)" />
        <circle cx="420" cy="381" r="5" fill="#0f172a" />
        <circle cx="420" cy="381" r="2" fill="#475569" />
        <circle cx="460" cy="381" r="5" fill="#0f172a" />
        <circle cx="460" cy="381" r="2" fill="#475569" />
      </g>
      <g filter="url(#shadow)" opacity="0.7">
        <ellipse cx="500" cy="315" rx="30" ry="3" fill="#0f172a" opacity="0.15" />
        <rect x="475" y="295" width="50" height="16" rx="6" fill="url(#ambulanceGrad)" />
        <path d="M482 295 L487 288 L513 288 L518 295 Z" fill="#e2e8f0" />
        <path d="M484 295 L488 290 L498 290 L498 295 Z" fill="#1e3a5f" opacity="0.4" />
        <path d="M500 295 L500 290 L511 290 L516 295 Z" fill="#1e3a5f" opacity="0.3" />
        <rect x="496" y="298" width="8" height="2" fill="#ef4444" rx="0.5" />
        <rect x="499" y="296" width="2" height="6" fill="#ef4444" rx="0.5" />
        <rect x="480" y="293" width="6" height="3" rx="1" fill="#ef4444" opacity="0.8" filter="url(#glow)" />
        <ellipse cx="525" cy="303" rx="2.5" ry="1.5" fill="#fef08a" opacity="0.6" filter="url(#glow)" />
        <circle cx="488" cy="313" r="5" fill="#0f172a" />
        <circle cx="488" cy="313" r="2" fill="#475569" />
        <circle cx="512" cy="313" r="5" fill="#0f172a" />
        <circle cx="512" cy="313" r="2" fill="#475569" />
      </g>
      <g filter="url(#shadow)" opacity="0.8">
        <ellipse cx="350" cy="380" rx="15" ry="2" fill="#0f172a" opacity="0.15" />
        <path d="M340 370 L345 365 L355 365 L360 370 L358 374 L342 374 Z" fill="#1e293b" />
        <circle cx="348" cy="362" r="3" fill="#1e293b" />
        <rect x="346" y="365" width="4" height="6" rx="1" fill="#1e293b" />
        <ellipse cx="360" cy="370" rx="1.5" ry="1" fill="#fef08a" opacity="0.6" filter="url(#glow)" />
        <circle cx="344" cy="376" r="3.5" fill="#0f172a" />
        <circle cx="344" cy="376" r="1.5" fill="#475569" />
        <circle cx="356" cy="376" r="3.5" fill="#0f172a" />
        <circle cx="356" cy="376" r="1.5" fill="#475569" />
      </g>
      <g>
        <rect x="320" y="345" width="22" height="16" rx="2" fill="url(#hologramRed)" opacity="0.1" />
        <rect x="320" y="345" width="22" height="16" rx="2" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.7" />
        <path d="M320 345 L324 345 M320 345 L320 349" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <path d="M342 345 L338 345 M342 345 L342 349" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <path d="M320 361 L324 361 M320 361 L320 357" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <path d="M342 361 L338 361 M342 361 L342 357" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <rect x="322" y="338" width="30" height="10" rx="3" fill="#ef4444" opacity="0.85" />
        <text x="325" y="345" fontSize="4.5" fill="white" fontWeight="bold">POTHOLE</text>
        <text x="325" y="349" fontSize="3.5" fill="white" opacity="0.8">98%</text>
      </g>
      <g>
        <rect x="255" y="352" width="30" height="14" rx="2" fill="url(#hologramOrange)" opacity="0.1" />
        <rect x="255" y="352" width="30" height="14" rx="2" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M255 352 L259 352 M255 352 L255 356" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <path d="M285 352 L281 352 M285 352 L285 356" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <path d="M255 366 L259 366 M255 366 L255 362" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <path d="M285 366 L281 366 M285 366 L285 362" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <rect x="258" y="345" width="24" height="10" rx="3" fill="#f59e0b" opacity="0.85" />
        <text x="261" y="352" fontSize="4.5" fill="white" fontWeight="bold">CRACK</text>
        <text x="261" y="356" fontSize="3.5" fill="white" opacity="0.8">96%</text>
      </g>
      <g>
        <rect x="478" y="360" width="24" height="16" rx="2" fill="url(#hologramBlue)" opacity="0.1" />
        <rect x="478" y="360" width="24" height="16" rx="2" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M478 360 L482 360 M478 360 L478 364" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
        <path d="M502 360 L498 360 M502 360 L502 364" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
        <path d="M478 376 L482 376 M478 376 L478 372" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
        <path d="M502 376 L498 376 M502 376 L502 372" stroke="#3b82f6" strokeWidth="1.5" opacity="0.9" />
        <rect x="480" y="353" width="32" height="10" rx="3" fill="#3b82f6" opacity="0.85" />
        <text x="483" y="360" fontSize="4.5" fill="white" fontWeight="bold">WATERLOG</text>
        <text x="483" y="364" fontSize="3.5" fill="white" opacity="0.8">94%</text>
      </g>
      <g>
        <rect x="160" y="330" width="28" height="14" rx="2" fill="url(#hologramOrange)" opacity="0.1" />
        <rect x="160" y="330" width="28" height="14" rx="2" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M160 330 L164 330 M160 330 L160 334" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <path d="M188 330 L184 330 M188 330 L188 334" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <path d="M160 344 L164 344 M160 344 L160 340" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <path d="M188 344 L184 344 M188 344 L188 340" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
        <rect x="162" y="323" width="30" height="10" rx="3" fill="#f59e0b" opacity="0.85" />
        <text x="165" y="330" fontSize="4.5" fill="white" fontWeight="bold">DAMAGED</text>
        <text x="165" y="334" fontSize="3.5" fill="white" opacity="0.8">95%</text>
      </g>
      <g>
        <rect x="72" y="352" width="28" height="16" rx="2" fill="url(#hologramRed)" opacity="0.1" />
        <rect x="72" y="352" width="28" height="16" rx="2" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M72 352 L76 352 M72 352 L72 356" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <path d="M100 352 L96 352 M100 352 L100 356" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <path d="M72 368 L76 368 M72 368 L72 364" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <path d="M100 368 L96 368 M100 368 L100 364" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
        <rect x="74" y="345" width="28" height="10" rx="3" fill="#ef4444" opacity="0.85" />
        <text x="77" y="352" fontSize="4.5" fill="white" fontWeight="bold">FALLEN TREE</text>
      </g>
      <g>
        <rect x="60" y="330" width="24" height="16" rx="2" fill="url(#hologramRed)" opacity="0.15" />
        <rect x="60" y="330" width="24" height="16" rx="2" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.8" />
        <path d="M60 330 L64 330 M60 330 L60 334" stroke="#ef4444" strokeWidth="2" opacity="1" />
        <path d="M84 330 L80 330 M84 330 L84 334" stroke="#ef4444" strokeWidth="2" opacity="1" />
        <path d="M60 346 L64 346 M60 346 L60 342" stroke="#ef4444" strokeWidth="2" opacity="1" />
        <path d="M84 346 L80 346 M84 346 L84 342" stroke="#ef4444" strokeWidth="2" opacity="1" />
        <rect x="62" y="323" width="28" height="10" rx="3" fill="#ef4444" opacity="0.9" />
        <text x="65" y="330" fontSize="4.5" fill="white" fontWeight="bold">ACCIDENT</text>
        <polygon points="72,338 67,346 77,346" fill="#ef4444" opacity="0.4" />
        <text x="71" y="344" fontSize="4" fill="white" fontWeight="bold">!</text>
      </g>
      <g filter="url(#shadowCard)">
        <rect x="15" y="15" width="135" height="55" rx="12" fill="url(#glassCard)" />
        <rect x="15" y="15" width="135" height="55" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <rect x="15" y="15" width="135" height="55" rx="12" fill="url(#glassCardDark)" opacity="0.03" />
        <circle cx="32" cy="32" r="9" fill="#3b82f6" opacity="0.1" />
        <circle cx="32" cy="32" r="4" fill="#3b82f6" filter="url(#glow)" />
        <text x="46" y="29" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">Live AI Detection</text>
        <text x="46" y="40" fontSize="5.5" fill="#64748b" fontFamily="system-ui">1,535 roads monitored</text>
        <circle cx="28" cy="52" r="3" fill="#22c55e" filter="url(#glow)" />
        <text x="34" y="54" fontSize="5.5" fill="#22c55e" fontWeight="bold" fontFamily="system-ui">Active</text>
        <text x="62" y="54" fontSize="5.5" fill="#64748b" fontFamily="system-ui">94% accuracy</text>
      </g>
      <g filter="url(#shadowCard)">
        <rect x="445" y="15" width="140" height="55" rx="12" fill="url(#glassCard)" />
        <rect x="445" y="15" width="140" height="55" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <rect x="445" y="15" width="140" height="55" rx="12" fill="url(#glassCardDark)" opacity="0.03" />
        <text x="460" y="29" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">Road Health Score</text>
        <text x="460" y="48" fontSize="16" fill="#22c55e" fontWeight="bold" fontFamily="system-ui">78</text>
        <text x="490" y="48" fontSize="6" fill="#64748b" fontFamily="system-ui">/ 100</text>
        <circle cx="550" cy="42" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <path d="M550 28 A14 14 0 0 1 560 38" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
        <text x="545" y="46" fontSize="6" fill="#22c55e" fontWeight="bold" fontFamily="system-ui">78%</text>
        <text x="460" y="58" fontSize="5" fill="#64748b" fontFamily="system-ui">↑ 12% from last month</text>
      </g>
      <g filter="url(#shadowCard)">
        <rect x="15" y="80" width="120" height="48" rx="12" fill="url(#glassCardAmber)" />
        <rect x="15" y="80" width="120" height="48" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <text x="28" y="95" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">Active Complaints</text>
        <text x="28" y="112" fontSize="14" fill="#f59e0b" fontWeight="bold" fontFamily="system-ui">247</text>
        <text x="68" y="112" fontSize="5.5" fill="#64748b" fontFamily="system-ui">open today</text>
        <circle cx="110" cy="95" r="6" fill="#f59e0b" opacity="0.1" />
        <circle cx="110" cy="95" r="3" fill="#f59e0b" filter="url(#glow)" />
      </g>
      <g filter="url(#shadowCard)">
        <rect x="145" y="80" width="120" height="48" rx="12" fill="url(#glassCard)" />
        <rect x="145" y="80" width="120" height="48" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <text x="158" y="95" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">Emergency Response</text>
        <text x="158" y="112" fontSize="14" fill="#ef4444" fontWeight="bold" fontFamily="system-ui">4.2</text>
        <text x="182" y="112" fontSize="5.5" fill="#64748b" fontFamily="system-ui">min avg</text>
        <circle cx="240" cy="95" r="6" fill="#ef4444" opacity="0.1" />
        <circle cx="240" cy="95" r="3" fill="#ef4444" filter="url(#glow)" />
      </g>
      <g filter="url(#shadowCard)">
        <rect x="275" y="80" width="110" height="48" rx="12" fill="url(#glassCard)" />
        <rect x="275" y="80" width="110" height="48" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <text x="288" y="95" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">Weather</text>
        <text x="288" y="112" fontSize="10" fill="#3b82f6" fontWeight="bold" fontFamily="system-ui">28°C</text>
        <text x="320" y="112" fontSize="5.5" fill="#64748b" fontFamily="system-ui">Partly Cloudy</text>
        <ellipse cx="360" cy="95" rx="8" ry="5" fill="#3b82f6" opacity="0.15" />
        <ellipse cx="358" cy="93" rx="5" ry="3" fill="#3b82f6" opacity="0.2" />
      </g>
      <g filter="url(#shadowCard)">
        <rect x="395" y="80" width="120" height="48" rx="12" fill="url(#glassCard)" />
        <rect x="395" y="80" width="120" height="48" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <text x="408" y="95" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">Traffic Density</text>
        <text x="408" y="112" fontSize="10" fill="#22c55e" fontWeight="bold" fontFamily="system-ui">Moderate</text>
        <text x="470" y="112" fontSize="5.5" fill="#64748b" fontFamily="system-ui">62%</text>
        <rect x="408" y="100" width="50" height="3" rx="1.5" fill="#e2e8f0" />
        <rect x="408" y="100" width="31" height="3" rx="1.5" fill="#22c55e" />
      </g>
      <g filter="url(#shadowCard)">
        <rect x="15" y="420" width="170" height="58" rx="12" fill="url(#glassCard)" />
        <rect x="15" y="420" width="170" height="58" rx="12" stroke="white" strokeWidth="1" opacity="0.6" />
        <rect x="15" y="420" width="170" height="58" rx="12" fill="url(#glassCardDark)" opacity="0.03" />
        <text x="28" y="437" fontSize="7" fill="#0f172a" fontWeight="bold" fontFamily="system-ui">YOLOv11 Detection Stats</text>
        <rect x="28" y="444" width="60" height="4" rx="2" fill="#ef4444" opacity="0.15" />
        <rect x="28" y="444" width="42" height="4" rx="2" fill="#ef4444" />
        <text x="92" y="447" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Potholes 42%</text>
        <rect x="28" y="452" width="60" height="4" rx="2" fill="#f59e0b" opacity="0.15" />
        <rect x="28" y="452" width="30" height="4" rx="2" fill="#f59e0b" />
        <text x="92" y="455" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Cracks 28%</text>
        <rect x="28" y="460" width="60" height="4" rx="2" fill="#3b82f6" opacity="0.15" />
        <rect x="28" y="460" width="22" height="4" rx="2" fill="#3b82f6" />
        <text x="92" y="463" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Water 18%</text>
        <rect x="28" y="468" width="60" height="4" rx="2" fill="#64748b" opacity="0.15" />
        <rect x="28" y="468" width="12" height="4" rx="2" fill="#64748b" />
        <text x="92" y="471" fontSize="4.5" fill="#64748b" fontFamily="system-ui">Other 12%</text>
      </g>
      <g opacity="0.08">
        <line x1="150" y1="42" x2="196" y2="235" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="450" y1="42" x2="401" y2="240" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="460" y1="95" x2="401" y2="240" stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="196" y1="235" x2="242" y2="235" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="15" y1="104" x2="196" y2="235" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2 3" />
        <line x1="145" y1="104" x2="196" y2="235" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 3" />
      </g>
      <rect x="0" y="400" width="600" height="100" fill="#064e3b" opacity="0.06" />
      <rect x="0" y="400" width="600" height="100" fill="#0f172a" opacity="0.04" />
    </svg>
  );
}

function MissionIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <filter id="glow2"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <radialGradient id="pulseGrad"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="#dbeafe" opacity="0.5" />
      <circle cx="100" cy="100" r="70" fill="#bfdbfe" opacity="0.4" />
      <circle cx="100" cy="100" r="50" fill="#93c5fd" opacity="0.3" />
      <circle cx="100" cy="100" r="30" fill="url(#pulseGrad)" />
      <circle cx="100" cy="100" r="30" fill="url(#pulseGrad)" />
      <circle cx="100" cy="100" r="20" fill="#3b82f6" opacity="0.8" filter="url(#glow2)" />
      <circle cx="100" cy="100" r="10" fill="white" />
      <circle cx="100" cy="100" r="4" fill="#3b82f6" />
      <line x1="100" y1="30" x2="100" y2="50" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      <line x1="100" y1="150" x2="100" y2="170" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      <line x1="30" y1="100" x2="50" y2="100" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      <line x1="150" y1="100" x2="170" y2="100" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
      <path d="M100 60 L120 70 L120 100 C120 130 100 145 100 145 C100 145 80 130 80 100 L80 70 Z" fill="#22c55e" opacity="0.2" stroke="#22c55e" strokeWidth="2" />
      <path d="M100 75 L110 80 L110 100 C110 118 100 128 100 128 C100 128 90 118 90 100 L90 80 Z" fill="#22c55e" opacity="0.3" />
    </svg>
  );
}

const journeySteps = [
  { icon: "🚧", label: "Road Reported",        color: "bg-red-50 dark:bg-red-950/40",     border: "border-red-200/60 dark:border-red-800/40",     dot: "bg-red-400" },
  { icon: "📋", label: "Complaint Submitted",   color: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/60 dark:border-amber-800/40", dot: "bg-amber-400" },
  { icon: "👷", label: "Authority Assigned",    color: "bg-blue-50 dark:bg-blue-950/40",   border: "border-blue-200/60 dark:border-blue-800/40",   dot: "bg-blue-400" },
  { icon: "🔧", label: "Repair Completed",      color: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200/60 dark:border-violet-800/40", dot: "bg-violet-400" },
  { icon: "✅", label: "Safe Road",             color: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/60 dark:border-emerald-800/40", dot: "bg-emerald-500" },
];

function RoadJourneyCard() {
  return (
    <div className="relative glass-card p-6 flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Complaint Journey</span>
      </div>

      {journeySteps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center">
          {/* Step card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border ${step.color} ${step.border}`}
          >
            <span className="text-xl leading-none">{step.icon}</span>
            <span className="text-sm font-semibold flex-1">{step.label}</span>
            <div className={`w-2 h-2 rounded-full ${step.dot}`} />
          </motion.div>

          {/* Animated arrow connector */}
          {i < journeySteps.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 + 0.2, duration: 0.3 }}
              style={{ originY: 0 }}
              className="flex flex-col items-center my-1"
            >
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="w-0.5 h-3 bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/60 rounded-full" />
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-muted-foreground/50" />
              </motion.div>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Animation Variants ── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Reusable Components ── */

function SectionBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border border-blue-200/50 dark:border-blue-800/30"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`text-3xl md:text-4xl font-extrabold tracking-tight ${className}`}
    >
      {children}
    </motion.h2>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed"
    >
      {children}
    </motion.p>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const num = parseInt(value.replace(/[^0-9]/g, ""));
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = num;
          const duration = 2000;
          const step = Math.max(1, Math.floor(end / 60));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, duration / (end / step));
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── District Dashboard ── */

const TN_DISTRICTS = [
  "Chennai", "Coimbatore", "Madurai", "Salem", "Trichy",
  "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
  "Thanjavur", "Kancheepuram", "Namakkal", "Cuddalore", "Villupuram",
  "Krishnagiri", "Dharmapuri", "Karur", "Pudukkottai", "Sivagangai",
  "Ramanathapuram", "Virudhunagar", "Tiruvannamalai", "Chengalpattu",
  "Ranipet", "Tirupathur", "Kallakurichi", "Tenkasi", "Tiruppur",
  "Nilgiris", "Ariyalur", "Perambalur", "Nagapattinam", "Thiruvarur",
  "Myladuthurai", "Kanniyakumari", "Thiruvallur", "Tirupattur",
];

interface DistrictStat {
  district: string;
  count: number;
  reports: { id: string; issue_type: string; status: string; address: string | null; created_at: string }[];
}

function statusColor(count: number) {
  if (count === 0) return { dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40", bar: "bg-emerald-500", label: "Clear" };
  if (count <= 5) return { dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40", bar: "bg-emerald-500", label: "Low" };
  if (count <= 12) return { dot: "bg-amber-400", badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40", bar: "bg-amber-400", label: "Moderate" };
  return { dot: "bg-red-500", badge: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-800/40", bar: "bg-red-500", label: "High" };
}

function DistrictModal({ district, onClose }: { district: DistrictStat; onClose: () => void }) {
  const color = statusColor(district.count);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-blue-100/60 dark:border-blue-900/30"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${color.dot}`} />
              <div>
                <h3 className="font-extrabold text-base">{district.district}</h3>
                <p className="text-xs text-muted-foreground">{district.count} active report{district.count !== 1 ? "s" : ""} · {color.label} priority</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              ✕
            </button>
          </div>
          {/* Body */}
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {district.reports.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium">No active reports</p>
                <p className="text-xs">This district is clear</p>
              </div>
            ) : (
              district.reports.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    r.status === "Resolved" ? "bg-emerald-500" :
                    r.status === "In Progress" ? "bg-blue-500" : "bg-amber-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{r.issue_type}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.address ?? "Location not specified"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    r.status === "Resolved" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60" :
                    r.status === "In Progress" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200/60" :
                    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60"
                  }`}>{r.status}</span>
                </motion.div>
              ))
            )}
          </div>
          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Link href="/complaints" onClick={onClose}>
              <motion.button whileHover={{ scale: 1.02 }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2">
                View All Complaints <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DistrictDashboard() {
  const [stats, setStats] = useState<DistrictStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DistrictStat | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/complaints")
      .then(r => r.json())
      .then((data: unknown) => {
        const complaints = Array.isArray(data) ? data as { id: string; issue_type: string; status: string; address: string | null; created_at: string }[] : [];
        const map = new Map<string, typeof complaints>();
        TN_DISTRICTS.forEach(d => map.set(d, []));
        complaints.forEach(c => {
          const addr = (c.address ?? "").toLowerCase();
          const match = TN_DISTRICTS.find(d => addr.includes(d.toLowerCase()));
          if (match) map.get(match)?.push(c);
        });
        setStats(TN_DISTRICTS.map(d => ({ district: d, count: map.get(d)?.length ?? 0, reports: map.get(d) ?? [] })));
      })
      .catch(() => setStats(TN_DISTRICTS.map(d => ({ district: d, count: 0, reports: [] }))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = stats.filter(s => s.district.toLowerCase().includes(search.toLowerCase()));
  const totalReports = stats.reduce((s, d) => s + d.count, 0);
  const highRisk = stats.filter(d => d.count > 12).length;
  const maxCount = Math.max(...stats.map(d => d.count), 1);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Tamil Nadu District Dashboard</h3>
              <p className="text-xs text-muted-foreground">Live complaint monitoring across districts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>
        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { label: "Total Reports", value: totalReports, color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" },
            { label: "High Risk", value: highRisk, color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400" },
            { label: "Districts", value: TN_DISTRICTS.length, color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`px-3 py-1 rounded-full text-[11px] font-bold ${color}`}>
              {value} {label}
            </div>
          ))}
        </div>
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search district..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-muted-foreground"
        />
      </div>

      {/* District list — shows 5 rows (~48px each), scroll for rest */}
      <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((d, i) => {
              const color = statusColor(d.count);
              const barW = Math.round((d.count / maxCount) * 100);
              return (
                <motion.button
                  key={d.district}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(d)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                  <span className="text-sm font-semibold flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{d.district}</span>
                  {/* Mini bar */}
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barW}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03 }}
                      className={`h-full rounded-full ${color.bar}`}
                    />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${color.badge} min-w-[72px] text-center`}>
                    {d.count} Report{d.count !== 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border flex flex-wrap gap-4">
        {[
          { dot: "bg-emerald-500", label: "Low (0–5)" },
          { dot: "bg-amber-400", label: "Moderate (6–12)" },
          { dot: "bg-red-500", label: "High (13+)" },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
          </div>
        ))}
      </div>

      {selected && <DistrictModal district={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── Main Page ── */

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const [currentTip, setCurrentTip] = useState(0);
  const [newsIndex, setNewsIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => setCurrentTip(prev => (prev + 1) % aiTips.length), 5000);
    const newsInterval = setInterval(() => setNewsIndex(prev => (prev + 1) % Math.ceil(newsUpdates.length / 3)), 4000);
    const testInterval = setInterval(() => setTestimonialIndex(prev => (prev + 1) % testimonials.length), 5000);
    return () => { clearInterval(tipInterval); clearInterval(newsInterval); clearInterval(testInterval); };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ════════════════════════════════════════ */}
      {/* HERO SECTION                           */}
      {/* ════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25 dark:opacity-40 pointer-events-none" />
        <motion.div animate={{ y: [0, -18, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <motion.div animate={{ y: [0, 18, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 dark:bg-blue-400/3 rounded-full blur-3xl" />

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative w-full">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/30 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
                  <Shield className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  TN Highways Dept Surveillance System
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                  <motion.span
                    initial={{ backgroundPosition: "0% 50%" }}
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 bg-clip-text text-transparent bg-[length:200%_200%]"
                  >
                    RoadPulse
                  </motion.span>
                  <br />
                  <span className="text-foreground">AI-Powered</span>
                  <br />
                  <motion.span
                    initial={{ backgroundPosition: "0% 50%" }}
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent bg-[length:200%_200%]"
                  >
                    Road Intelligence
                  </motion.span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Transforming Tamil Nadu's roads with real-time AI defect detection,
                  smart monitoring, and citizen-powered reporting for safer, smarter infrastructure.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap justify-center gap-3">
                <Link href="/chatbot">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
                    <Camera className="h-4 w-4" />
                    Report a Road Issue
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                </Link>
                <Link href="#about">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 border-2 border-blue-200 dark:border-blue-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-foreground px-8 py-4 rounded-xl font-bold text-sm hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all duration-300">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Explore Platform
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-wrap justify-center items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {["T", "H", "M", "J"].map((letter, i) => (
                    <motion.div key={letter} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      {letter}
                    </motion.div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shadow-sm">+20</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">20+</span> active users across Tamil Nadu
                </div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* ABOUT + MISSION                        */}
      {/* ════════════════════════════════════════ */}
      <section id="about" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <div className="space-y-5">
                <SectionBadge icon={Sparkles} label="About RoadWatch" />
                <SectionTitle className="!text-left">
                  Transforming Road Maintenance Through Smart Citizen Reporting{" "}
                  <span className="bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">Artificial Intelligence</span>
                </SectionTitle>
                <SectionSubtitle>
                  RoadPulse is a smart road monitoring platform designed to help citizens and highway authorities identify, report, and resolve road issues efficiently. By bringing together public participation, real-time tracking, and intelligent monitoring, the platform ensures that road defects are addressed faster, improving safety, reducing accidents, and creating better travel experiences for everyone.
                </SectionSubtitle>
                <motion.div className="space-y-3 pt-2" variants={staggerContainer}>
                  {[
                    { icon: Brain , text: "Report road issues in just a few clicks with location and photo support" },
                    { icon: MapPin, text: "GPS-enabled complaint tracking with live status updates" },
                    { icon: BarChart3Icon, text: "Data-driven insights for infrastructure planning" },
                  ].map(({ icon: Icon, text }, i) => (
                    <motion.div
                      key={text}
                      variants={staggerItem}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.2}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur-2xl" />
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="relative glass-card-green p-8 md:p-10 space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 mx-auto"
                  >
                    <MissionIllustration />
                  </motion.div>
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border border-emerald-200/50 dark:border-emerald-800/30">
                      <Target className="h-3.5 w-3.5" />
                      Our Mission
                    </div>
                    <h3 className="text-2xl font-extrabold">Safer Roads for Every Citizen</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Our mission is to create a reliable platform that connects citizens with highway authorities, enabling faster reporting, efficient issue resolution, and proactive road maintenance. By encouraging community participation and improving communication, RoadPulse aims to make every journey safer and every road better maintained.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { value: "50+", label: "Issues Tracked" },
                      { value: "38", label: "Districts" },
                    ].map(({ value, label }) => (
                      <motion.div
                        key={label}
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-emerald-200/30 dark:border-emerald-800/20"
                      >
                        <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{value}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* HOW IT WORKS                            */}
      {/* ════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-blue-50/30 to-emerald-50/30 dark:via-blue-950/10 dark:via-emerald-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <SectionBadge icon={Zap} label="How It Works" />
            <SectionTitle>
              From Detection to{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Resolution</span>
            </SectionTitle>
            <SectionSubtitle>
              RoadPulse simplifies road issue reporting by connecting citizens and highway authorities through a transparent and efficient process, ensuring faster maintenance and safer roads.
            </SectionSubtitle>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-20" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
              {howItWorks.map(({ step, icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.15}
                >
                  <div className="relative group">
                    <div className="flex items-center justify-center mb-5">
                      <div className="relative">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.4 }}
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-300 group-hover:-translate-y-1`}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-[10px] font-bold text-blue-500 dark:text-blue-400 tracking-widest">{step}</div>
                      <h3 className="font-extrabold text-base">{title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px] mx-auto">{desc}</p>
                    </div>
                    {i < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute -right-4 top-14 text-blue-300 dark:text-blue-700">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* DISTRICT DASHBOARD + AI TIP            */}
      {/* ════════════════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="lg:col-span-2"
            >
              <DistrictDashboard />
            </motion.div>

            {/* AI Safety Tip Carousel */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.2}
            >
              <div className="glass-card-blue h-full flex flex-col group">
                <div className="p-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base">AI Safety Tip</h3>
                      <p className="text-xs text-muted-foreground">Powered by RoadPulse AI</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex-1 px-5 pb-5 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTip}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-sm leading-relaxed text-foreground/80 italic">
                        &ldquo;{aiTips[currentTip]}&rdquo;
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex gap-1">
                          {aiTips.map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: i === currentTip ? 1.2 : 1 }}
                              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === currentTip ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className="ml-auto">Tip {currentTip + 1} of {aiTips.length}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-b-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* NEWS & UPDATES - Auto Carousel         */}
      {/* ════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent dark:via-blue-950/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <SectionBadge icon={Newspaper} label="Latest Updates" />
            <SectionTitle>
              Road Safety{" "}
              <span className="bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">News & Updates</span>
            </SectionTitle>
            <SectionSubtitle>
              Stay informed about the latest developments in road infrastructure and safety across Tamil Nadu.
            </SectionSubtitle>
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={newsIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid md:grid-cols-3 gap-5"
              >
                {newsUpdates.slice(newsIndex * 3, newsIndex * 3 + 3).map(({ date, title, tag, tagColor }, i) => (
                  <motion.div
                    key={title}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="glass-card p-6 h-full group cursor-pointer transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-2 h-2 rounded-full bg-${tagColor}-500`} />
                      <span className={`text-[10px] font-bold text-${tagColor}-600 dark:text-${tagColor}-400 uppercase tracking-wider`}>{tag}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{date}</span>
                    </div>
                    <h4 className="font-bold text-sm leading-relaxed group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h4>
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read More <ArrowRight className="h-3 w-3" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Carousel dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.ceil(newsUpdates.length / 3) }).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setNewsIndex(i)}
                  animate={{ scale: i === newsIndex ? 1.2 : 1 }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === newsIndex ? "bg-blue-500" : "bg-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* COMMUNITY IMPACT                       */}
      {/* ════════════════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <SectionBadge icon={Users} label="Community Impact" />
                  <SectionTitle className="!text-left">
                    Powered by{" "}
                    <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">People Like You</span>
                  </SectionTitle>
                  <SectionSubtitle>
                    Every report filed, every issue resolved brings us closer to safer roads. 
                    Here's the impact our community has made together.
                  </SectionSubtitle>
                </div>

                <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3">
                  {communityStats.map(({ value, label, icon: Icon }, i) => (
                    <motion.div
                      key={label}
                      variants={staggerItem}
                      whileHover={{ y: -2, scale: 1.02 }}
                      className="glass-card-sm p-5 text-center group hover:bg-white dark:hover:bg-white/10 transition-colors"
                    >
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.4 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                      >
                        <Icon className="h-5 w-5 text-blue-500" />
                      </motion.div>
                      <div className="text-2xl md:text-3xl font-extrabold text-foreground">
                        <AnimatedCounter value={value} />
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">{label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.2}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-3xl blur-2xl" />
                <div className="relative">
                  <RoadJourneyCard />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* TESTIMONIALS CAROUSEL                   */}
      {/* ════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent dark:via-blue-950/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <SectionBadge icon={Quote} label="Testimonials" />
            <SectionTitle>
              What People{" "}
              <span className="bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">Are Saying</span>
            </SectionTitle>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="glass-card p-8 md:p-10 text-center"
              >
                <Quote className="h-8 w-8 mx-auto text-blue-300 dark:text-blue-700 mb-4" />
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed italic mb-6">
                  &ldquo;{testimonials[testimonialIndex].text}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="font-bold text-sm">{testimonials[testimonialIndex].name}</div>
                <div className="text-xs text-muted-foreground">{testimonials[testimonialIndex].role}</div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTestimonialIndex(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    animate={{ scale: i === testimonialIndex ? 1.2 : 1 }}
                    className={`w-2 h-2 rounded-full transition-colors ${i === testimonialIndex ? "bg-blue-500" : "bg-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTestimonialIndex(prev => (prev + 1) % testimonials.length)}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* INSPIRATIONAL QUOTE BANNER             */}
      {/* ════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 dark:from-blue-800 dark:via-blue-700 dark:to-emerald-800" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/5 blur-3xl"
        />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="max-w-4xl mx-auto space-y-8"
          >
            <Quote className="h-12 w-12 mx-auto text-white/30" />
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-[1.3]">
              &ldquo;The road to a smarter future is built one safe kilometer at a time. 
              With AI and community, we're paving the way for zero preventable incidents.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">RoadPulse Initiative</div>
                <div className="text-xs text-white/60">Government of Tamil Nadu — Highways Department</div>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  <Star className="h-4 w-4 text-yellow-300/60 fill-yellow-300/60" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* CTA SECTION                            */}
      {/* ════════════════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="glass-card p-10 md:p-14 text-center max-w-4xl mx-auto space-y-6"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20"
            >
              <Heart className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Be Part of the Change
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Your voice matters. Report road issues, track their resolution, and help us 
              build a safer Tamil Nadu — one road at a time.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/chatbot">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                  <Camera className="h-4 w-4" />
                  Report an Issue
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/complaints">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 border-2 border-blue-200 dark:border-blue-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-foreground px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all duration-300"
                >
                  <Activity className="h-4 w-4 text-blue-500" />
                  Track Complaints
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* FOOTER                                  */}
      {/* ════════════════════════════════════════ */}
      <footer className="border-t border-blue-100/60 dark:border-blue-900/30 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-950/10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all duration-300 shadow-md shadow-blue-500/10">
                  <Image src="/Logo.png" alt="RoadPulse" fill sizes="40px" className="object-cover" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">RoadPulse</span>
                  <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">TN Highways Dept.</span>
                </div>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">AI-powered road monitoring platform for the Government of Tamil Nadu Highways Department. Making roads safer through technology and community participation.</p>
              <div className="flex gap-2">
                {[Shield, Heart, Leaf, Globe].map((Icon, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.1 }} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer">
                    <Icon className="h-4 w-4 text-blue-500" />
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2.5">
                {[{ label: "Report an Issue", href: "/chatbot" }, { label: "Track Complaints", href: "/complaints" }, { label: "Risk Predictor", href: "/risk-predictor" }, { label: "Analytics", href: "/analytics" }].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-blue-400" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5">
                {[{ label: "Emergency Contacts", href: "/emergency" }, { label: "Budget Tracker", href: "/budget" }, { label: "Safety Guidelines", href: "#" }, { label: "FAQ", href: "#" }].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-blue-400" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3">
                {[{ icon: MapPin, text: "Highways Department, Chennai, Tamil Nadu" }, { icon: Phone, text: "Toll-Free: 1800-XXX-XXXX" }, { icon: MailIcon, text: "support@roadpulse.tn.gov.in" }].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-blue-100/50 dark:border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span>© {new Date().getFullYear()} Government of Tamil Nadu</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">All rights reserved.</span>
              <span className="hidden sm:inline">·</span>
              <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <span>·</span>
              <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-400" />
              <span>for Tamil Nadu</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}