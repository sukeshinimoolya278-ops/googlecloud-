"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { Home, FileText, Pill, QrCode, ShieldAlert } from "lucide-react";

export function DesktopNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/reports", label: t("reports"), icon: FileText },
    { href: "/medicines", label: t("medicines"), icon: Pill },
    { href: "/qr", label: t("qr"), icon: QrCode },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-purple-600" : "text-slate-500"} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <Link
        href="/qr?tab=emergency"
        className="flex items-center gap-1.5 px-3.5 py-2 ml-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
      >
        <ShieldAlert size={15} className="text-rose-600" />
        <span>Emergency QR</span>
      </Link>
    </nav>
  );
}
