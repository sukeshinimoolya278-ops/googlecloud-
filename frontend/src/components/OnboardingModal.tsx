"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, User, Phone, Globe, Shield, Sparkles } from "lucide-react";

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const { profile, completeOnboarding } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [language, setLanguage] = useState(profile?.preferred_language || "en");
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group && profile.blood_group !== "Unknown" ? profile.blood_group : "B+");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("Daughter");
  const [saving, setSaving] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी (Hindi)" },
    { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
  ];

  const handleSave = async () => {
    setSaving(true);
    const contacts = contactName.trim() && contactPhone.trim() ? [
      {
        name: contactName.trim(),
        relationship: contactRelation,
        phone: contactPhone.trim(),
        is_primary: true,
      }
    ] : undefined;

    await completeOnboarding({
      full_name: fullName.trim() || "Patient",
      preferred_language: language,
      blood_group: bloodGroup,
    }, contacts);

    setSaving(false);
    onComplete();
  };

  const handleSkip = async () => {
    setSaving(true);
    await completeOnboarding({});
    setSaving(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-purple-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <HeartPulse size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Welcome to Health Vault!</h2>
          <p className="text-purple-100 text-sm mt-1">Let&apos;s set up your digital medical card in 30 seconds.</p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User size={16} className="text-purple-600" />
              <span>Your Full Name</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="w-full text-base sm:text-lg font-medium px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe size={16} className="text-purple-600" />
              <span>Preferred Explanation Language</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`py-3 px-3 rounded-2xl font-bold text-sm border-2 transition-all text-center ${
                    language === lang.code
                      ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Shield size={16} className="text-rose-600" />
              <span>Blood Group (For Emergency Responders)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`py-2.5 rounded-xl font-extrabold text-base border-2 transition-all ${
                    bloodGroup === bg
                      ? "border-rose-600 bg-rose-50 text-rose-700"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Emergency Contact */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Phone size={16} className="text-emerald-600" />
              <span>Primary Emergency Contact</span>
            </label>
            <div className="space-y-2.5">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact Name (e.g. Pooja Sharma)"
                className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-purple-600 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-purple-600 outline-none"
                />
                <select
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-purple-600 outline-none"
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Son">Son</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Friend">Friend</option>
                  <option value="Doctor">Doctor</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="w-full sm:w-auto order-2 sm:order-1 text-slate-500 hover:text-slate-800 font-bold text-sm py-2.5 px-4 rounded-xl transition-all"
          >
            Skip / make it fast ⚡
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 py-3.5 px-7 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-base shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={18} />
            <span>{saving ? "Saving..." : "Save & Continue"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
