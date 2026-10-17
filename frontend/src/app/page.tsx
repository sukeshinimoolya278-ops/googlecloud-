"use client";

import React, { useState } from "react";
import { useTheme } from "./providers";
import { useAuth } from "../context/AuthContext";
import { useLanguage, Language } from "../context/LanguageContext";
import { AuthModal } from "../components/AuthModal";
import {
  Sun,
  Moon,
  Activity,
  QrCode,
  Pill,
  Upload,
  ShieldCheck,
  Languages,
  User as UserIcon,
  Stethoscope,
  LogOut,
  Sparkles,
  ArrowRight,
  HeartPulse,
  UserCheck
} from "lucide-react";

export default function Home() {
  const { theme, toggleTheme, fontScale, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
  const { user, logout, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* Top Bar / Navigation */}
      <header className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)] gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] flex items-center justify-center text-[var(--accent-lime)] shadow-sm">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {t("appName")}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              {t("tagline")} &bull; Phase 2 Auth & Roles
            </p>
          </div>
        </div>

        {/* Controls: A+/A-, Lang, Theme, User Auth */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Text scale */}
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-2 py-1 shadow-sm">
            <button
              onClick={decreaseFontSize}
              aria-label="Decrease text size"
              className="px-2 py-1 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              A-
            </button>
            <button
              onClick={resetFontSize}
              aria-label="Reset text size"
              className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {(fontScale * 100).toFixed(0)}%
            </button>
            <button
              onClick={increaseFontSize}
              aria-label="Increase text size"
              className="px-2 py-1 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              A+
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-3 py-1.5 shadow-sm text-sm font-medium">
            <Languages className="w-4 h-4 mr-1 text-[var(--text-muted)]" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
              <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ</option>
            </select>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent-lime)] transition-colors shadow-sm cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-[#b4f434]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* User Status / Login Button */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRoleModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-lime)] text-xs font-bold text-[var(--text-primary)] shadow-sm cursor-pointer"
                title="Click to switch role or edit profile"
              >
                {user.role === "doctor" ? (
                  <Stethoscope className="w-3.5 h-3.5 text-[var(--badge-text)]" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-[var(--badge-text)]" />
                )}
                <span className="capitalize">{user.role}</span>
              </button>
              <button
                onClick={logout}
                aria-label="Log Out"
                className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors shadow-sm cursor-pointer"
                title={t("logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="vault-btn-primary text-sm px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8 flex flex-col gap-6">
        {/* User Welcome / Active Session Banner */}
        {user ? (
          <section className="vault-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-[var(--accent-lime)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center font-bold text-xl shadow-inner">
                {user.role === "doctor" ? <Stethoscope className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {user.full_name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--badge-bg)] text-[var(--badge-text)] capitalize">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {user.role === "doctor"
                    ? `License: ${user.doctor_reg_no || "KMC-48291"} • Doctor Portal`
                    : `Phone: ${user.phone || "+919876543210"} • Blood Group: ${user.profile?.blood_group || "B+"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRoleModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-lime)] transition-all cursor-pointer"
              >
                Switch Role / Edit
              </button>
            </div>
          </section>
        ) : (
          <section className="vault-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card-subtle)]">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--badge-bg)] text-[var(--badge-text)] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phase 2 Live &bull; Demo Ready</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {t("loginTitle")}
              </h2>
              <p className="text-base text-[var(--text-secondary)] mt-2">
                {t("loginSubtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="vault-btn-primary text-base font-bold px-6 py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>{t("demoLogin")}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {/* Doctor View vs Patient View */}
        {user?.role === "doctor" ? (
          <div className="flex flex-col gap-6">
            <div className="vault-card p-8 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                <QrCode className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                Scan Patient QR Code
              </h3>
              <p className="text-base text-[var(--text-secondary)] max-w-md mt-2">
                In Phase 7, doctors scan patient tokens to request 24-hour access to clinical records, lab trends, and active prescriptions.
              </p>
              <button
                className="vault-btn-primary mt-6 text-base font-bold px-8 py-3.5 flex items-center gap-2 opacity-90 cursor-not-allowed"
                disabled
              >
                <QrCode className="w-5 h-5" />
                <span>Scan QR / Enter Code (Phase 7)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Health Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Wellness */}
              <div className="vault-card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                    Health Status
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] flex items-center justify-center text-[var(--badge-text)]">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-[var(--text-primary)]">86</span>
                  <span className="text-sm text-[var(--text-secondary)]">/100</span>
                  <p className="text-sm font-medium text-[var(--badge-text)] mt-1">
                    ● Looking good
                  </p>
                </div>
                <div className="w-full bg-[var(--bg-card-subtle)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--accent-lime)] h-full w-[86%]" />
                </div>
              </div>

              {/* Card 2: Lab Results */}
              <div className="vault-card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                    Lab Results
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] flex items-center justify-center text-[var(--badge-text)]">
                    <Upload className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-[var(--text-primary)]">14</span>
                  <span className="text-sm text-[var(--text-secondary)]">/25 results</span>
                  <p className="text-sm font-medium text-amber-400 mt-1">
                    ● Hemoglobin & Glucose flagged
                  </p>
                </div>
                <div className="w-full bg-[var(--bg-card-subtle)] h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[56%]" />
                </div>
              </div>

              {/* Card 3: Active Medicines */}
              <div className="vault-card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                    {t("myMedicines")}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] flex items-center justify-center text-[var(--badge-text)]">
                    <Pill className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-[var(--text-primary)]">2</span>
                  <span className="text-sm text-[var(--text-secondary)]"> active meds</span>
                  <p className="text-sm font-medium text-[var(--badge-text)] mt-1">
                    ● Metformin & Amlodipine
                  </p>
                </div>
                <div className="w-full bg-[var(--bg-card-subtle)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--accent-lime)] h-full w-[67%]" />
                </div>
              </div>
            </div>

            {/* 4 Large Core Action Cards from Section 10 */}
            <section>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                Core Vault Modules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Module 1: Upload */}
                <div className="vault-card p-5 flex flex-col justify-between hover:border-[var(--accent-lime)] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">
                      {t("uploadReport")}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      AI extracts key tests into plain language.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold text-[var(--badge-text)] group-hover:translate-x-1 transition-transform">
                    <span>Phase 4</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>

                {/* Module 2: Medicines */}
                <div className="vault-card p-5 flex flex-col justify-between hover:border-[var(--accent-lime)] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">
                      {t("myMedicines")}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Dose timing, meal guidance & one-tap intake.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold text-[var(--badge-text)] group-hover:translate-x-1 transition-transform">
                    <span>Phase 5</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>

                {/* Module 3: Doctor QR */}
                <div className="vault-card p-5 flex flex-col justify-between hover:border-[var(--accent-lime)] transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">
                      {t("doctorQr")}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Grant secure 24-hr access to your physician.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold text-[var(--badge-text)] group-hover:translate-x-1 transition-transform">
                    <span>Phase 6</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>

                {/* Module 4: Emergency Card */}
                <div className="vault-card p-5 flex flex-col justify-between hover:border-red-400/50 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">
                      {t("emergencyCard")}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Public instant life-saving scan without login.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold text-red-400 group-hover:translate-x-1 transition-transform">
                    <span>Phase 3 & 6</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer / Safety Disclaimer (Section 9) */}
      <footer className="pt-6 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex flex-col gap-2">
        <p className="max-w-2xl mx-auto leading-relaxed">
          &ldquo;{t("disclaimer")}&rdquo;
        </p>
        <p className="text-[var(--text-muted)]">
          {t("appName")} &copy; 2025 &bull; Built with Next.js, FastAPI & Google Gemini
        </p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Role Switcher Modal */}
      <AuthModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        initialRoleSwitch={true}
      />
    </div>
  );
}
