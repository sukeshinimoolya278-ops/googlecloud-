"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { Home, FileText, Pill, QrCode, Settings } from "lucide-react";

export function BottomNav() {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-[72px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? "text-teal-800 font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all ${
                  isActive ? "bg-teal-100 text-teal-800 scale-105" : ""
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.8 : 2} />
              </div>
              <span className={`text-[12px] leading-tight tracking-tight ${isActive ? "font-black text-teal-900" : "font-semibold"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
