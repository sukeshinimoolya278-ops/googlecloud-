"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { UploadModal } from "../components/UploadModal";
import { VerificationModal } from "../components/VerificationModal";
import { ProfileEditModal } from "../components/ProfileEditModal";
import {
  FileUp,
  AlertTriangle,
  QrCode,
  Volume2,
  VolumeX,
  PhoneCall,
  Activity,
  Heart,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  Stethoscope,
  Edit3,
  ShieldCheck
} from "lucide-react";

export default function HomePage() {
  const { t, language, speak, isSpeaking, stopSpeaking } = useLanguage();
  const { profile, emergencyContacts, refreshProfile } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [verificationDoc, setVerificationDoc] = useState<any | null>(null);

  const handleReadSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const name = profile?.full_name || "Ramesh Sharma";
    const bg = profile?.blood_group || "B+";
    const textToRead =
      language === "hi"
        ? `नमस्ते ${name}। आपका ब्लड ग्रुप ${bg} है। आपको पेनिसिलिन से एलर्जी है। आपकी वर्तमान दवाइयां समय पर लें और आपातकाल में संपर्क करें।`
        : language === "kn"
        ? `ನಮಸ್ಕಾರ ${name}. ನಿಮ್ಮ ರಕ್ತದ ಗುಂಪು ${bg}. ಪೆನ್ಸಿಲಿನ್ ಅಲರ್ಜಿ ಇದೆ. ನಿಯಮಿತವಾಗಿ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಿ.`
        : language === "ta"
        ? `வணக்கம் ${name}. உங்கள் இரத்த வகை ${bg}. பென்சிலின் ஒவ்வாமை உள்ளது.`
        : `Hello ${name}. Blood group ${bg}. Severe penicillin allergy recorded. Taking 3 active medications.`;
    speak(textToRead);
  };

  const primaryContact = emergencyContacts[0] || { name: "Pooja Sharma", phone: "+919811122233" };

  return (
    <div className="space-y-6">
      {/* Top Profile Bar (Both PC & Mobile) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowProfileEdit(true)}
            className="badge-pill-indigo hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Click to edit profile"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{profile?.full_name || "Ramesh Sharma"} ({profile?.age || 62}M)</span>
            <Edit3 size={11} className="ml-0.5 text-indigo-200" />
          </button>
          <span className="badge-pill-magenta">
            Blood Group: {profile?.blood_group || "B+"}
          </span>
          <span className="badge-pill-green">
            {profile?.allergies?.[0] ? `${profile.allergies[0]} Allergic` : "Penicillin Allergic"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <ShieldCheck size={13} className="text-sky-600" />
            <span>ABHA Verified: {profile?.abha_id || "91-4829-1029-4821"}</span>
          </span>
        </div>

        <button
          onClick={handleReadSummary}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition-all shadow-xs"
        >
          {isSpeaking ? (
            <>
              <VolumeX size={15} className="text-rose-500" />
              <span>Stop Speaking</span>
            </>
          ) : (
            <>
              <Volume2 size={15} className="text-purple-600" />
              <span>{t("readAloud")}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Responsive Grid: 1 Col on Mobile, 2 Cols on PC (lg:grid-cols-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-fuchsia-600 to-pink-600 p-6 sm:p-8 text-white shadow-xl">
            <div className="relative z-10 space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold tracking-wide uppercase">
                Emergency &amp; Clinical Lifeline
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Your Entire Medical History, <br />
                <span className="text-yellow-300">One Scan Away.</span>
              </h1>
              <p className="text-white/85 text-xs sm:text-base font-medium max-w-lg">
                AI extracted, patient confirmed, and translated in Hindi, Kannada, Tamil, &amp; English.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center justify-center gap-2.5 py-3.5 px-6 bg-white text-slate-900 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:bg-slate-50 transition-all active:scale-95"
                >
                  <FileUp size={20} className="text-purple-600" />
                  <span>{t("uploadReport")}</span>
                </button>
                <Link
                  href="/qr"
                  className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-bold text-sm sm:text-base text-white transition-all"
                >
                  <QrCode size={20} />
                  <span>{t("qr")}</span>
                </Link>
              </div>
            </div>

            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Emergency Alert Banner */}
          <div className="card-aesthetic p-5 border-l-4 border-rose-500 bg-rose-50/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl mt-0.5 shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {t("emergencyQR")}
                    </h3>
                    <span className="badge-critical text-[10px]">CRITICAL</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Severe Allergies: <strong className="text-rose-700">{profile?.allergies?.join(", ") || "Penicillin, Sulfa drugs"}</strong>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Emergency Contact: {primaryContact.name} ({primaryContact.phone})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${primaryContact.phone}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <PhoneCall size={15} /> Call
                </a>
                <Link
                  href="/qr?tab=emergency"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Show QR
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/medicines"
              className="card-aesthetic p-4 hover:border-purple-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 group-hover:scale-105 transition-all">
                  <Activity size={20} />
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  3 Active
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{t("medicines")}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Metformin, Telma, Atorva
              </p>
            </Link>

            <Link
              href="/reports"
              className="card-aesthetic p-4 hover:border-fuchsia-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2.5 rounded-xl bg-pink-100 text-pink-700 group-hover:scale-105 transition-all">
                  <Heart size={20} />
                </span>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  3 Labs
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{t("reports")}</h4>
              <p className="text-xs text-slate-500 mt-1">
                HbA1c 7.2% (Controlled)
              </p>
            </Link>
          </div>

          {/* Active Doctor Consent Status Card */}
          <div className="card-aesthetic p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Stethoscope size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Doctor Consent Portal
                </h3>
              </div>
              <span className="badge-pill-green text-[10px]">
                Authorized
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Active: <strong>Apollo Emergency (Dr. Mehta)</strong> has time-limited read access.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                Expires in ~22 hours
              </span>
              <Link
                href="/qr?tab=consent"
                className="font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                Manage <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* AI Multilingual Translator Card */}
          <div className="card-aesthetic p-5 bg-gradient-to-br from-purple-50/60 to-pink-50/40">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-purple-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                4-Language Plain Translation
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Medical reports are simplified with zero jargon. Read them in English, Hindi, Kannada, or Tamil anytime.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/reports"
                className="btn-secondary text-xs py-2 w-auto px-4"
              >
                Browse Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadSuccess={(doc) => {
            setShowUpload(false);
            setVerificationDoc(doc);
          }}
        />
      )}

      {/* Verification Modal with real dynamic document extraction */}
      {verificationDoc && (
        <VerificationModal
          documentId={verificationDoc.id}
          fileName={verificationDoc.file_name}
          docType={verificationDoc.type}
          onClose={() => setVerificationDoc(null)}
          onConfirmSuccess={() => {
            setVerificationDoc(null);
            refreshProfile();
            alert("Verification complete! Data is confirmed and saved to your vault.");
          }}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEditModal onClose={() => setShowProfileEdit(false)} />
      )}
    </div>
  );
}
