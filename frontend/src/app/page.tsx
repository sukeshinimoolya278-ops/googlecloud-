"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./providers";
import {
  Sun,
  Moon,
  Activity,
  QrCode,
  Pill,
  Upload,
  AlertCircle,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Server,
  ArrowRight,
  HeartPulse
} from "lucide-react";

export default function Home() {
  const { theme, toggleTheme, fontScale, increaseFontSize, decreaseFontSize, resetFontSize } = useTheme();
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [apiData, setApiData] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "kn">("en");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        setApiStatus("connected");
        setApiData(data);
      })
      .catch((err) => {
        console.warn("Backend not yet connected:", err);
        setApiStatus("disconnected");
      });
  }, [apiUrl]);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* Top Bar / Navigation */}
      <header className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)] gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] flex items-center justify-center text-[var(--accent-lime)] shadow-sm">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              QR Health Vault
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              Care at a glance &bull; Phase 1 Setup
            </p>
          </div>
        </div>

        {/* Accessibility & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Font scale buttons */}
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

          {/* Language selector */}
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-3 py-1.5 shadow-sm text-sm font-medium">
            <Languages className="w-4 h-4 mr-1 text-[var(--text-muted)]" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-transparent text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">EN</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
              <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ</option>
            </select>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:border-[var(--accent-lime)] transition-colors shadow-sm"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-[#b4f434]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 flex flex-col gap-6">
        {/* Backend & Schema Verification Banner */}
        <section className="vault-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${apiStatus === "connected" ? "bg-[#22c55e] animate-pulse" : apiStatus === "checking" ? "bg-amber-400" : "bg-red-500"}`} />
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[var(--text-secondary)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  FastAPI SQLite Backend & Database
                </h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {apiStatus === "connected"
                  ? `Connected at ${apiUrl} &bull; 9 tables initialized &bull; Demo data seeded`
                  : apiStatus === "checking"
                  ? "Checking local backend connectivity..."
                  : `Backend offline. Run: backend\\venv\\Scripts\\python.exe -m uvicorn backend.main:app`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--badge-bg)] text-[var(--badge-text)]">
              <CheckCircle2 className="w-4 h-4" />
              Phase 1 Setup Done
            </span>
          </div>
        </section>

        {/* Hero Card / Dashboard Inspiration from Reference Image */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Wellness & Overview */}
          <div className="vault-card p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                Health Status
              </span>
              <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] flex items-center justify-center text-[var(--badge-text)]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">94</span>
              <span className="text-sm text-[var(--text-secondary)]">/100</span>
              <p className="text-sm font-medium text-[var(--badge-text)] mt-1">
                ● Vitals in normal range
              </p>
            </div>
            <div className="w-full bg-[var(--bg-card-subtle)] h-2 rounded-full overflow-hidden">
              <div className="bg-[var(--accent-lime)] h-full w-[94%]" />
            </div>
          </div>

          {/* Card 2: Lab Results & AI */}
          <div className="vault-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                Seeded Reports
              </span>
              <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] flex items-center justify-center text-[var(--badge-text)]">
                <Upload className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">2</span>
              <span className="text-sm text-[var(--text-secondary)]"> verified reports</span>
              <p className="text-sm font-medium text-amber-400 mt-1">
                ● 2 flags (Hemoglobin & Glucose)
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              CBC Panel &bull; Lipid Profile
            </span>
          </div>

          {/* Card 3: Prescriptions */}
          <div className="vault-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                Medicines
              </span>
              <div className="w-8 h-8 rounded-full bg-[var(--badge-bg)] flex items-center justify-center text-[var(--badge-text)]">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">2</span>
              <span className="text-sm text-[var(--text-secondary)]"> active medications</span>
              <p className="text-sm font-medium text-[var(--badge-text)] mt-1">
                ● Metformin & Amlodipine
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Next dose: Tonight after dinner
            </span>
          </div>
        </div>

        {/* 4 Large Core Action Cards from Section 10 */}
        <section>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
            Core Vault Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1 */}
            <div className="vault-card p-5 flex flex-col justify-between hover:border-[var(--accent-lime)] transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[var(--text-primary)]">
                  Upload Report
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

            {/* Action 2 */}
            <div className="vault-card p-5 flex flex-col justify-between hover:border-[var(--accent-lime)] transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[var(--text-primary)]">
                  My Medicines
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

            {/* Action 3 */}
            <div className="vault-card p-5 flex flex-col justify-between hover:border-[var(--accent-lime)] transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[var(--text-primary)]">
                  Doctor QR
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

            {/* Action 4 */}
            <div className="vault-card p-5 flex flex-col justify-between hover:border-red-400/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[var(--text-primary)]">
                  Emergency Card
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

        {/* Demo Patient & Doctor Seeded Credentials */}
        <section className="vault-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-[var(--accent-lime)]" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Seeded Demo Accounts (Section 11)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <p className="font-bold text-[var(--text-primary)] mb-1">👤 Demo Patient (Rahul Sharma)</p>
              <p className="text-[var(--text-secondary)]">Phone: <code className="text-[var(--text-primary)] font-mono">+919876543210</code></p>
              <p className="text-[var(--text-secondary)]">Blood Group: <strong>B+</strong> &bull; Age: <strong>42</strong></p>
              <p className="text-[var(--text-secondary)]">Mock OTP: <code className="text-[var(--text-primary)] font-mono">123456</code> (or One-Tap Demo)</p>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <p className="font-bold text-[var(--text-primary)] mb-1">🩺 Demo Doctor (Dr. Emily Peterson)</p>
              <p className="text-[var(--text-secondary)]">Phone: <code className="text-[var(--text-primary)] font-mono">+919876543220</code></p>
              <p className="text-[var(--text-secondary)]">Reg No: <strong>KMC-48291</strong> (Cardiology)</p>
              <p className="text-[var(--text-secondary)]">Mock OTP: <code className="text-[var(--text-primary)] font-mono">123456</code> (or One-Tap Demo)</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer / Safety Disclaimer (Section 9) */}
      <footer className="pt-6 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex flex-col gap-2">
        <p className="max-w-2xl mx-auto leading-relaxed">
          &ldquo;This is an AI explanation to help you understand your report. It is not medical advice. Please consult your doctor.&rdquo;
        </p>
        <p className="text-[var(--text-muted)]">
          QR Health Vault &copy; 2025 &bull; Built with Next.js, FastAPI & Google Gemini
        </p>
      </footer>
    </div>
  );
}
