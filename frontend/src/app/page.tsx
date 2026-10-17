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
      {/* Top Patient Health Summary Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowProfileEdit(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-black text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Click to edit profile"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{profile?.full_name || "Ramesh Sharma"} ({profile?.age || 62}M)</span>
            <Edit3 size={13} className="text-teal-200" />
          </button>
          
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-700 text-white font-black text-xs sm:text-sm shadow-xs">
            Blood Group: {profile?.blood_group || "B+"}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-100 text-amber-950 border-2 border-amber-400 font-black text-xs sm:text-sm">
            ⚠️ {profile?.allergies?.[0] ? `${profile.allergies[0]} Allergic` : "Penicillin Allergic"}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sky-50 text-sky-900 border-2 border-sky-300 font-black text-xs sm:text-sm">
            <ShieldCheck size={16} className="text-sky-700" />
            <span>ABHA ID: {profile?.abha_id || "91-4829-1029-4821"}</span>
          </span>
        </div>

        {/* Large Accessible Voice Reader */}
        <button
          onClick={handleReadSummary}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-teal-100 hover:bg-teal-200 text-teal-950 rounded-2xl text-sm font-black transition-all shadow-xs border-2 border-teal-300 active:scale-95"
        >
          {isSpeaking ? (
            <>
              <VolumeX size={18} className="text-rose-600 animate-bounce" />
              <span>Stop Speaking</span>
            </>
          ) : (
            <>
              <Volume2 size={18} className="text-teal-800" />
              <span>🔊 {t("readAloud")}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Clinical Teal Hero & Emergency Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Medical Welcome Banner */}
          <div className="rounded-3xl bg-teal-800 p-6 sm:p-8 text-white shadow-lg border-2 border-teal-700 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-900/80 text-emerald-300 text-xs font-black tracking-wider uppercase border border-teal-600">
              <Stethoscope size={16} />
              <span>Official Patient Medical Vault</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Your Entire Health History, <br />
              <span className="text-amber-300">Simple &amp; One Scan Away.</span>
            </h1>

            <p className="text-teal-100 text-sm sm:text-base font-semibold max-w-xl leading-relaxed">
              Safe storage for blood tests, prescriptions, and emergency lifeline. Explained in plain English, Hindi, Kannada, &amp; Tamil.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center justify-center gap-3 py-4 px-6 bg-white text-teal-950 rounded-2xl font-black text-base shadow-md hover:bg-teal-50 transition-all active:scale-95 border-2 border-white"
              >
                <FileUp size={22} className="text-teal-700" />
                <span>+ {t("uploadReport")}</span>
              </button>
              
              <Link
                href="/qr"
                className="flex items-center justify-center gap-2.5 py-4 px-6 bg-teal-900 hover:bg-teal-950 text-white rounded-2xl font-black text-base border-2 border-teal-600 shadow-md transition-all active:scale-95"
              >
                <QrCode size={22} />
                <span>Show My QR Codes</span>
              </Link>
            </div>
          </div>

          {/* Emergency Lifeline Banner (High Contrast Medical Red) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-rose-50 border-3 border-rose-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldAlert size={30} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                      {t("emergencyQR")} (Emergency Lifeline)
                    </h3>
                    <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                      CRITICAL
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    Severe Allergies: <strong className="text-rose-700 underline">{profile?.allergies?.join(", ") || "Penicillin, Sulfa drugs"}</strong>
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
                    Family Contact: <strong>{primaryContact.name}</strong> ({primaryContact.phone})
                  </p>
                </div>
              </div>

              {/* Action Buttons for Emergencies */}
              <div className="flex items-center gap-3 w-full sm:w-auto pt-1 sm:pt-0">
                <a
                  href={`tel:${primaryContact.phone}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-sm font-black shadow-md transition-all active:scale-95"
                >
                  <PhoneCall size={18} />
                  <span>Call Family</span>
                </a>
                <Link
                  href="/qr?tab=emergency"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-sm font-black shadow-md transition-all active:scale-95"
                >
                  <QrCode size={18} />
                  <span>Emergency QR</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Big Touch Cards (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Access Big Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/medicines"
              className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-teal-500 shadow-sm transition-all group active:scale-98"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-all">
                  <Activity size={24} />
                </span>
                <span className="text-xs font-black text-teal-900 bg-teal-100 border border-teal-300 px-3 py-1 rounded-full">
                  3 Active
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-base sm:text-lg">Daily Medicines</h4>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Reminders &amp; safety checks
              </p>
            </Link>

            <Link
              href="/reports"
              className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-teal-500 shadow-sm transition-all group active:scale-98"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-105 transition-all">
                  <Heart size={24} />
                </span>
                <span className="text-xs font-black text-sky-900 bg-sky-100 border border-sky-300 px-3 py-1 rounded-full">
                  3 Reports
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-base sm:text-lg">Medical Tests</h4>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Blood tests &amp; AI summary
              </p>
            </Link>
          </div>

          {/* Active Doctor Consent Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Doctor Access Portal
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    Consent-controlled sharing
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                <CheckCircle size={12} /> Authorized
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Active: <strong>Apollo Emergency (Dr. Mehta)</strong> has time-limited read access.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs sm:text-sm border border-slate-200">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <Clock size={16} className="text-slate-400" />
                Expires in ~22 hours
              </span>
              <Link
                href="/qr?tab=consent"
                className="font-black text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                Manage <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* AI Multilingual Translator Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-teal-50 border-2 border-teal-200 space-y-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-teal-700" />
              <h4 className="font-black text-teal-950 text-base">
                Plain-Language Voice &amp; Translation
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              Medical reports are simplified with zero complicated jargon. Hear and read them in English, Hindi, Kannada, or Tamil.
            </p>
            <div className="pt-1">
              <Link
                href="/reports"
                className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs sm:text-sm shadow-xs transition-all active:scale-95"
              >
                <span>Browse All Reports</span>
                <ArrowRight size={15} />
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
