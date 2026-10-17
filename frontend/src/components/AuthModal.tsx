"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  User,
  Stethoscope,
  Phone,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  X
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialRoleSwitch?: boolean;
}

export function AuthModal({ isOpen, onClose, initialRoleSwitch = false }: AuthModalProps) {
  const { user, loginDemo, loginPhoneOtp, updateRole, error, clearError, isLoading } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"demo" | "phone" | "role">(
    initialRoleSwitch ? "role" : "demo"
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Role update state
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor">(user?.role || "patient");
  const [doctorRegNo, setDoctorRegNo] = useState(user?.doctor_reg_no || "");
  const [fullName, setFullName] = useState(user?.full_name || "");

  if (!isOpen) return null;

  const handleDemoLogin = async (role: "patient" | "doctor") => {
    setLocalError(null);
    clearError();
    try {
      await loginDemo(role);
      if (onClose) onClose();
    } catch (err: any) {
      setLocalError(err.message || "Demo login failed");
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!phoneNumber || phoneNumber.length < 10) {
      setLocalError("Please enter a valid 10-digit phone number");
      return;
    }
    setOtpSent(true);
    setOtpCode("123456"); // Pre-fill mock OTP for optimal UX
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setLocalLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      await loginPhoneOtp(formattedPhone, otpCode);
      if (onClose) onClose();
    } catch (err: any) {
      setLocalError(err.message || "OTP verification failed");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setLocalLoading(true);
    try {
      await updateRole(selectedRole, selectedRole === "doctor" ? doctorRegNo : undefined, fullName);
      if (onClose) onClose();
    } catch (err: any) {
      setLocalError(err.message || "Role update failed");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="vault-card w-full max-w-lg p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] relative overflow-hidden shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--badge-bg)] text-[var(--badge-text)] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Secure Access &bull; Section 5 Auth</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {activeTab === "role" ? t("roleSelectTitle") : t("loginTitle")}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {activeTab === "role"
              ? "Switch your profile between Patient and Doctor access."
              : t("loginSubtitle")}
          </p>
        </div>

        {/* Tabs */}
        {!initialRoleSwitch && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-card-subtle)] rounded-2xl mb-6 border border-[var(--border-subtle)]">
            <button
              onClick={() => {
                setActiveTab("demo");
                setLocalError(null);
              }}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "demo"
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t("demoLogin")}
            </button>
            <button
              onClick={() => {
                setActiveTab("phone");
                setLocalError(null);
              }}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "phone"
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t("phoneLogin")}
            </button>
          </div>
        )}

        {/* Error notification */}
        {(localError || error) && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* TAB 1: ONE-TAP DEMO */}
        {activeTab === "demo" && (
          <div className="flex flex-col gap-3.5">
            <button
              onClick={() => handleDemoLogin("patient")}
              disabled={isLoading || localLoading}
              className="w-full text-left p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-[var(--accent-lime)] transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center font-bold">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                      {t("demoPatient")}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Full profile, 2 lab reports, 3 medicines, Emergency QR
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--badge-text)] group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleDemoLogin("doctor")}
              disabled={isLoading || localLoading}
              className="w-full text-left p-4 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] hover:border-[var(--accent-lime)] transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center font-bold">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                      {t("demoDoctor")}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Reg No: KMC-48291 &bull; 24-hr Patient History Review
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--badge-text)] group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* TAB 2: PHONE OTP */}
        {activeTab === "phone" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Phone Number (India)
                  </label>
                  <div className="flex items-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] px-4 py-3 focus-within:border-[var(--accent-lime)]">
                    <Phone className="w-5 h-5 text-[var(--text-muted)] mr-2 shrink-0" />
                    <span className="text-sm font-semibold text-[var(--text-secondary)] mr-2">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      className="bg-transparent text-[var(--text-primary)] w-full outline-none font-semibold text-base"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--badge-bg)] text-[var(--badge-text)] text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t("mockNotice")}</span>
                </div>

                <button
                  type="submit"
                  className="vault-btn-primary w-full text-base font-bold flex items-center justify-center gap-2 mt-2"
                >
                  <span>{t("getOtp")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-bold text-[var(--badge-text)] hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>

                  <div className="flex items-center rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] px-4 py-3 focus-within:border-[var(--accent-lime)]">
                    <KeyRound className="w-5 h-5 text-[var(--text-muted)] mr-2 shrink-0" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="bg-transparent text-[var(--text-primary)] w-full outline-none font-bold text-lg tracking-widest"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--badge-bg)] text-[var(--badge-text)] text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Mock mode OTP is 123456</span>
                </div>

                <button
                  type="submit"
                  disabled={localLoading}
                  className="vault-btn-primary w-full text-base font-bold flex items-center justify-center gap-2 mt-2"
                >
                  {localLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{t("verifyOtp")}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: ROLE SELECTION / PROFILE EDIT */}
        {activeTab === "role" && (
          <form onSubmit={handleRoleUpdate} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {t("fullName")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent-lime)] font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("patient")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === "patient"
                    ? "border-[var(--accent-lime)] bg-[var(--badge-bg)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]"
                }`}
              >
                <User className="w-6 h-6 mb-2 text-[var(--badge-text)]" />
                <h4 className="font-bold text-[var(--text-primary)]">{t("patientRole")}</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{t("patientDesc")}</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("doctor")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedRole === "doctor"
                    ? "border-[var(--accent-lime)] bg-[var(--badge-bg)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]"
                }`}
              >
                <Stethoscope className="w-6 h-6 mb-2 text-[var(--badge-text)]" />
                <h4 className="font-bold text-[var(--text-primary)]">{t("doctorRole")}</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{t("doctorDesc")}</p>
              </button>
            </div>

            {selectedRole === "doctor" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  {t("doctorRegNo")}
                </label>
                <input
                  type="text"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  placeholder="e.g. KMC-48291"
                  className="w-full rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] px-4 py-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent-lime)] font-mono font-semibold"
                  required={selectedRole === "doctor"}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={localLoading}
              className="vault-btn-primary w-full text-base font-bold flex items-center justify-center gap-2 mt-2"
            >
              {localLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{t("continue")}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
