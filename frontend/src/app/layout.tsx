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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/20">
            <HeartPulse size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Vault</span>
              </span>
              <span className="badge-pill-green text-[10px] py-0 px-2">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none">
              One scan away
            </p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <DesktopNav />

        {/* Right Header: Profile, Settings, Login / Logout, Language Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/settings"
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs"
                title="Account Settings & Profile"
              >
                <User size={13} className="text-purple-600" />
                <span className="max-w-[100px] truncate">{profile?.full_name?.split(" ")[0] || "Profile"}</span>
                <Settings size={12} className="text-slate-400" />
              </Link>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-extrabold transition-all shadow-xs"
            >
              <LogIn size={13} />
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
