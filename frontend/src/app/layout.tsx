"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import { DesktopNav } from "../components/DesktopNav";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { OnboardingModal } from "../components/OnboardingModal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartPulse, User, LogIn, LogOut, Settings, RefreshCw } from "lucide-react";

function HeaderBar() {
  const { profile, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Medical Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-md group-hover:bg-teal-800 transition-all">
            <HeartPulse size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 tracking-tight text-lg sm:text-xl">
                Health<span className="text-teal-700">Vault</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                + MEDICAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-none">
              Safe &amp; Simple Health Record
            </p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <DesktopNav />

        {/* Right Header: Profile, Settings, Login / Logout, Language Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs sm:text-sm font-black transition-all border-2 border-teal-200 shadow-2xs"
                title="Account Settings & Profile"
              >
                <User size={15} className="text-teal-700" />
                <span className="max-w-[110px] truncate">{profile?.full_name?.split(" ")[0] || "Profile"}</span>
                <Settings size={14} className="text-teal-600" />
              </Link>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-2xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-all"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 py-2 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-black transition-all shadow-sm"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/doctor/") ||
    pathname.startsWith("/emergency/");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        router.push("/login");
      } else if (isAuthenticated && !hasCompletedOnboarding && pathname !== "/login") {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, hasCompletedOnboarding, pathname, router]);

  // Loading spinner during initial auth check on protected routes
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw size={36} className="text-purple-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Checking secure session...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-10 selection:bg-fuchsia-200">
        <LanguageProvider>
          <AuthProvider>
            <HeaderBar />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
              <RouteGuard>{children}</RouteGuard>
            </main>
            <BottomNav />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
