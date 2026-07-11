"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, FileText, Sun, Moon, LogIn, LogOut,
  LayoutDashboard, AlertTriangle, Phone, IndianRupee,
  BarChart2, HardHat, Home, Menu, X, Mail,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { NotificationBell } from "@/components/layout/NotificationBell";

const navLinks = [
  { href: "/",               label: "Home",         icon: Home },
  { href: "/chatbot",        label: "Chatbot",       icon: MessageSquare },
  { href: "/complaints",     label: "Complaints",    icon: FileText },
  { href: "/risk-predictor", label: "Risk",          icon: AlertTriangle },
  { href: "/budget",         label: "Budget",        icon: IndianRupee },
  { href: "/analytics",      label: "Analytics",     icon: BarChart2 },
  { href: "/emergency",      label: "Emergency",     icon: Phone },
  { href: "/contact",        label: "Contact",       icon: Mail },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout: authLogout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await authLogout();
    toast.success("Logged out successfully", { duration: 3000 });
    setTimeout(() => { window.location.href = "/"; }, 1500);
  };

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/engineer") ||
    pathname.startsWith("/executive-engineer")
  ) return null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-blue-500/20 dark:border-blue-400/15 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-md shadow-blue-500/5">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">

          {/* ── LOGO ── */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 group-hover:scale-105 transition-all duration-300 shadow-md shadow-blue-500/10">
              <Image
                src="/Logo.png"
                alt="RoadPulse Logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                RoadPulse
              </span>
              <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase telemetry-font hidden sm:block">
                TN HIGHWAY DEPT
              </span>
            </div>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative gap-1.5 text-xs font-semibold transition-all duration-300",
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/15 rounded-md border border-blue-500/30 dark:border-blue-400/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </Button>
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Button>
              </Link>
            )}
            {user?.role === "engineer" && (
              <Link href="/engineer/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <HardHat className="h-3.5 w-3.5" /> My Work
                </Button>
              </Link>
            )}
          </nav>

          {/* ── RIGHT ACTIONS ── */}
          <div className="flex items-center gap-1.5">
            {/* System Status Tag (High Tech Indicator) */}
            

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {user ? (
              <div className="hidden md:flex items-center gap-1.5">
                <NotificationBell />
                <Link href="/profile">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-blue-500/20 border-2",
                      pathname === "/profile" ? "border-blue-400" : "border-transparent"
                    )}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </motion.button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  <LogIn className="h-3.5 w-3.5" /> Login
                </motion.button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-blue-100/60 dark:border-blue-900/30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                      pathname === href
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                      <Icon className="h-4 w-4" /> {label}
                    </div>
                  </Link>
                ))}
                {!user && (
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white mt-1">
                      <LogIn className="h-4 w-4" /> Login
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
