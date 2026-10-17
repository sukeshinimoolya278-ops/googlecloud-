"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { Home, FileText, Pill, QrCode, ShieldAlert, Settings } from "lucide-react";

export function DesktopNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/reports", label: t("reports"), icon: FileText },
    { href: "/medicines", label: t("medicines"), icon: Pill },
    { href: "/qr", label: t("qr"), icon: QrCode },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
              isActive
                ? "bg-white text-teal-800 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-teal-900 hover:bg-white/60"
            }`}
          >
            <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-teal-700" : "text-slate-500"} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <Link
        href="/qr?tab=emergency"
        className="flex items-center gap-1.5 px-4 py-2.5 ml-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95"
      >
        <ShieldAlert size={16} className="text-white" />
        <span>EMERGENCY SOS</span>
      </Link>
    </nav>
  );
}
