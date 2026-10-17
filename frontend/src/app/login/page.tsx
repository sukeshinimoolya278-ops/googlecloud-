"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../lib/firebase";
import {
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithGoogle,
    loginAsDemo,
    isFirebaseReady,
  } = useAuth();

  // Screen modes: 'SELECT_METHOD' | 'PHONE_INPUT' | 'OTP_INPUT' | 'GMAIL_INPUT'
  const [mode, setMode] = useState<"SELECT_METHOD" | "PHONE_INPUT" | "OTP_INPUT" | "GMAIL_INPUT">("SELECT_METHOD");

  // Phone state
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Gmail state
  const [gmailAddress, setGmailAddress] = useState("");

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Recaptcha verifier ref
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === "OTP_INPUT" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  // Cleanup recaptcha verifier
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
      }
    };
  }, []);

  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current && typeof window !== "undefined") {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            setError("reCAPTCHA expired. Please try sending OTP again.");
          },
        });
      } catch (e) {
        console.warn("Recaptcha init notice", e);
      }
    }
    return recaptchaVerifierRef.current;
  };

  // 1. Send Phone OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      setError("Please enter a valid phone number (10 digits).");
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;
    setLoading(true);

    try {
      let appVerifier = undefined;
      if (isFirebaseConfigured()) {
        appVerifier = initRecaptcha();
      }

      const confirmation = await sendPhoneOtp(fullPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setMode("OTP_INPUT");
      setResendTimer(30);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      console.error("Send OTP failed", err);
      if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please check the country code and number.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. For security, please wait 5 minutes before trying again.");
      } else {
        setError("Unable to send OTP. Please try again or use Demo Sign-In.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Resend Phone OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setResendTimer(30);
    setCanResend(false);
    await handleSendOtp();
  };

  // 3. Verify Phone OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otp.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!confirmationResult) {
      setError("Session expired. Please request a new OTP.");
      setMode("PHONE_INPUT");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyPhoneOtp(confirmationResult, fullCode);
      router.push("/");
    } catch (err: any) {
      console.error("Verify OTP failed", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Incorrect 6-digit code. Please check your SMS and try again.");
      } else if (err.code === "auth/code-expired") {
        setError("This code has expired. Please tap 'Resend Code'.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many wrong attempts. Please wait 5 minutes before trying again.");
      } else {
        setError("Verification failed. Please check the code or try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP inputs auto-advance
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean && val !== "") return;

    const newOtp = [...otp];
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split("");
      pasted.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      if (pasted.length === 6) {
        handleVerifyOtp(pasted.join(""));
      }
      return;
    }

    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && clean && newOtp.every((digit) => digit !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Google Sign-In via Popup
  const handleGooglePopup = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (err: any) {
      console.warn("Google popup error:", err.code || err.message);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Popup window was closed. You can also enter your Gmail address directly below.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please enter your Gmail address below.");
      } else {
        setError("Please enter your Gmail address directly below to continue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In via Entered Gmail Address
  const handleGmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = gmailAddress.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid Gmail address (e.g. anivesh@gmail.com).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(cleanEmail);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with this Gmail.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for Reviewers
  const handleDemoLogin = async () => {
    setLoading(true);
    await loginAsDemo();
    router.push("/");
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-6 px-3 sm:px-6">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Top Hero Brand Header */}
        <div className="bg-teal-800 p-7 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3.5 shadow-inner">
            <HeartPulse size={36} className="text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">QR Health Vault</h1>
          <p className="text-teal-100 text-sm font-semibold mt-1">
            Official Patient &amp; Emergency Medical Portal
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mx-6 mt-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm font-bold flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: METHOD SELECTION (Large Buttons, Elderly-Friendly)    */}
        {/* ============================================================ */}
        {mode === "SELECT_METHOD" && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Sign In to Your Vault
              </h2>
              <p className="text-slate-600 text-sm font-medium mt-1">
                Choose how you want to sign in
              </p>
            </div>

            {/* Large Button: Continue with Phone */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("PHONE_INPUT");
              }}
              className="w-full group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-lg sm:text-xl shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Phone size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="leading-tight">Continue with Phone</div>
                  <div className="text-xs text-teal-100 font-medium mt-0.5">Fast 6-digit OTP via SMS</div>
                </div>
              </div>
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Large Button: Continue with Google / Gmail */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("GMAIL_INPUT");
              }}
              className="w-full group flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-slate-300 hover:border-teal-600 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-lg sm:text-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  {/* Google SVG Icon */}
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="leading-tight">Continue with Google</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Choose or enter your Gmail</div>
                </div>
              </div>
              <ArrowRight size={22} className="text-slate-400 group-hover:translate-x-1 group-hover:text-teal-700 transition-all" />
            </button>

            {/* Quick Demo Reviewer Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-sm transition-all border border-teal-200 shadow-2xs"
              >
                <Sparkles size={16} />
                <span>Instant Hackathon Demo (Ramesh Sharma)</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: GMAIL / GOOGLE ACCOUNT SELECTION                      */}
        {/* ============================================================ */}
        {mode === "GMAIL_INPUT" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("SELECT_METHOD");
                }}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 mb-2 inline-flex items-center gap-1"
              >
                ← Back to sign-in options
              </button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Mail size={24} className="text-teal-700" />
                <span>Sign In with Gmail</span>
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Choose an account via Google popup or type your Gmail address.
              </p>
            </div>

            {/* Option A: Open Google Account Picker Popup */}
            <div>
              <button
                type="button"
                onClick={handleGooglePopup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-teal-600 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-base transition-all shadow-xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Choose Account (Google Popup)</span>
              </button>
            </div>

            {/* Visual Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">or enter your gmail</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* Option B: Enter Gmail Address Form */}
            <form onSubmit={handleGmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Gmail Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    autoFocus
                    required
                    value={gmailAddress}
                    onChange={(e) => setGmailAddress(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full text-base sm:text-lg font-semibold px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Quick add:</span>
                {["@gmail.com", "@googlemail.com"].map((suffix) => (
                  <button
                    key={suffix}
                    type="button"
                    onClick={() => {
                      if (!gmailAddress.includes("@")) {
                        setGmailAddress((prev) => prev + suffix);
                      }
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
                  >
                    {suffix}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || !gmailAddress.includes("@")}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with this Gmail</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: PHONE NUMBER ENTRY (Clean, 360px Tested)              */}
        {/* ============================================================ */}
        {mode === "PHONE_INPUT" && (
          <form onSubmit={handleSendOtp} className="p-6 sm:p-8 space-y-6">
            <div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("SELECT_METHOD");
                }}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 mb-2 inline-flex items-center gap-1"
              >
                ← Back to sign-in options
              </button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Enter Phone Number
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                We will send a 6-digit verification code to your mobile.
              </p>
            </div>

            {/* Input with Country Code */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100 transition-all bg-white overflow-hidden shadow-2xs">
                {/* Editable / Selectable Country Code */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-100 text-slate-900 font-extrabold text-base sm:text-lg px-3 sm:px-4 py-3.5 border-r border-slate-200 outline-none cursor-pointer"
                >
                  <option value="+91">🇮🇳 +91 (India)</option>
                  <option value="+1">🇺🇸 +1 (USA)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
                  <option value="+65">🇸🇬 +65 (Singapore)</option>
                </select>

                <input
                  type="tel"
                  autoFocus
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="w-full text-lg sm:text-xl font-bold text-slate-900 px-4 py-3.5 outline-none tracking-wide"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || phoneNumber.length < 7}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit Code</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: 6-DIGIT OTP ENTRY WITH 30s RESEND TIMER               */}
        {/* ============================================================ */}
        {mode === "OTP_INPUT" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("PHONE_INPUT");
                }}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 mb-2 inline-flex items-center gap-1"
              >
                ← Edit phone number
              </button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Enter Verification Code
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Sent to <span className="font-bold text-slate-800">{countryCode} {phoneNumber}</span>
              </p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-black text-slate-900 rounded-2xl border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all bg-slate-50 focus:bg-white shadow-2xs"
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => !d)}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Verify &amp; Enter Vault</span>
                </>
              )}
            </button>

            {/* 30s Countdown Resend */}
            <div className="text-center pt-2">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm font-extrabold text-teal-700 hover:text-teal-900 underline decoration-2 underline-offset-4"
                >
                  Resend Code via SMS
                </button>
              ) : (
                <div className="text-sm text-slate-500 font-semibold">
                  Resend code in <span className="font-bold text-slate-800">{resendTimer}s</span>
                </div>
              )}
            </div>

            {/* Fallback tip */}
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-center">
              <span className="text-xs text-teal-900 font-semibold">
                Tip: In Demo Mode, enter <strong className="font-black text-teal-950">123456</strong> to sign in immediately.
              </span>
            </div>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>Protected with 256-bit AES encryption &amp; Firebase Auth</span>
        </div>
      </div>
    </div>
  );
}
