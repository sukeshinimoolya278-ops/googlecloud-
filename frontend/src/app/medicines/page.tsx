"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  Pill,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from "lucide-react";

export default function MedicinesPage() {
  const { t, speak, isSpeaking, stopSpeaking } = useLanguage();
  const [activeMeds, setActiveMeds] = useState<any[]>([]);
  const [pastMeds, setPastMeds] = useState<any[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch("/api/medicines/", {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMeds(data.active_medicines || []);
        setPastMeds(data.past_medicines || []);
      }
    } catch (err) {
      console.error("Error fetching medicines", err);
    }
  };

  const handleReadMedicine = (med: any) => {
    if (playingId === med.id && isSpeaking) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }
    setPlayingId(med.id);
    const speech = `Medicine: ${med.name}. Dose: ${med.dose}. Timing: ${med.frequency}. Instructions: ${med.instructions}. ${med.days_left} days left.`;
    speak(speech);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Prescription &amp; Medication Corner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Current active courses, dosage timings, days left, and allergy protection
          </p>
        </div>
        <span className="badge-pill-indigo self-start sm:self-auto">
          3 Ongoing Prescriptions
        </span>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Allergy Protection Active
            </h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Cross-reactive Penicillins, Ampicillin, and Sulfa antibiotics are flagged automatically.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block badge-critical text-[10px]">
          STRICT GUARD
        </span>
      </div>

      {/* Active Medicines Section (Responsive Grid: 1 Col on phone, 2 or 3 Cols on PC) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            {t("activeMedicines")} ({activeMeds.length})
          </h2>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full">
            Active Schedule
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMeds.map((med) => (
            <div
              key={med.id}
              className="card-aesthetic p-5 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Pill size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {med.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
                          {med.dose}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {med.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Read Aloud Button */}
                  <button
                    onClick={() => handleReadMedicine(med)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-2xs shrink-0"
                    title={t("readAloud")}
                  >
                    {playingId === med.id && isSpeaking ? (
                      <VolumeX size={18} className="text-rose-500" />
                    ) : (
                      <Volume2 size={18} className="text-purple-600" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                  <strong>Instructions:</strong> {med.instructions || "Take with water after meals"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock size={13} />
                  Until {med.end_date}
                </span>
                <span className="font-extrabold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full text-xs">
                  {med.days_left} {t("daysLeft")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Medicines Collapsible Section */}
      <div className="pt-2">
        <button
          onClick={() => setShowPast(!showPast)}
          className="w-full flex items-center justify-between p-4 bg-slate-100/90 hover:bg-slate-200/70 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 transition-all"
        >
          <span>
            {t("pastMedicines")} ({pastMeds.length}) — Courses Completed
          </span>
          {showPast ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showPast && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {pastMeds.map((med) => (
              <div
                key={med.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 opacity-80 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{med.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {med.dose} • {med.frequency}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Completed on {med.end_date}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Ended
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
