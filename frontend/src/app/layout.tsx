"use client";

import React, { useState } from "react";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import { DesktopNav } from "../components/DesktopNav";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ProfileEditModal } from "../components/ProfileEditModal";
import { LoginModal } from "../components/LoginModal";
import Link from "next/link";
import { HeartPulse, User, LogIn, LogOut, Edit3 } from "lucide-react";

function HeaderBar() {
  const { profile, isAuthenticated, logout } = useAuth();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
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

          {/* Right Header: Profile Pill, Login / Edit, Language Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs"
                  title="Edit Patient Profile"
                >
                  <User size={13} className="text-purple-600" />
                  <span className="max-w-[100px] truncate">{profile?.full_name?.split(" ")[0]}</span>
                  <Edit3 size={11} className="text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 py-1 px-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {showProfileEdit && (
        <ProfileEditModal onClose={() => setShowProfileEdit(false)} />
      )}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
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
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
