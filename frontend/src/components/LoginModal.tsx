"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Lock, Phone, Sparkles, CheckCircle2, ShieldCheck, X } from "lucide-react";

interface LoginModalProps {
  onClose?: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { sendOtp, verifyOtp, loginAsDemo } = useAuth();
  const { t } = useLanguage();

  const [phone, setPhone] = useState("+91 98765 43210");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      setOtp("123456"); // Pre-fill test OTP for instantaneous test convenience
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const ok = await verifyOtp(phone, otp);
      if (ok) {
        if (onClose) onClose();
      } else {
        setError("Invalid OTP code. Please enter 123456.");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneClickDemo = async () => {
    setIsLoading(true);
    await loginAsDemo();
    setIsLoading(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-teal-800 text-white relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-black/10"
            >
              <X size={18} />
            </button>
          )}
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
            Patient Portal
          </span>
          <h2 className="text-2xl font-black">Sign In to Health Vault</h2>
          <p className="text-xs text-white/80 mt-1">
            Access encrypted records, consent controls, and emergency lifelines.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Demo Hint Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck size={16} /> DEMO MODE ACTIVE
            </span>
            <span className="bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-md">
              Test OTP: 123456
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary py-3 text-sm"
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full py-3 px-4 text-center tracking-widest text-2xl font-black rounded-xl border border-teal-400 bg-teal-50/50 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary py-3 text-sm"
              >
                {isLoading ? "Verifying..." : "Verify & Enter Vault"}
              </button>
            </form>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase">
              Or Instant Sign In
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* 1-Click Demo Login */}
          <button
            onClick={handleOneClickDemo}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98"
          >
            <Sparkles size={16} className="text-yellow-400" />
            <span>1-Click Demo as Ramesh Sharma</span>
          </button>
        </div>
      </div>
    </div>
  );
}
