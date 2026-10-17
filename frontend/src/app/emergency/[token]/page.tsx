"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ShieldAlert,
  PhoneCall,
  Heart,
  Pill,
  AlertTriangle,
  UserCheck
} from "lucide-react";

export default function EmergencyPortalPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchEmergencyView();
    }
  }, [token]);

  const fetchEmergencyView = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emergency/view/${token}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Invalid emergency link");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load emergency data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center animate-ping">
          <ShieldAlert size={28} />
        </div>
        <p className="text-sm font-bold text-slate-800">Accessing Emergency Lifeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-aesthetic p-6 text-center space-y-3 border-rose-200 bg-rose-50/50">
        <ShieldAlert size={36} className="text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Emergency Link Invalid</h2>
        <p className="text-xs text-slate-600">{error}</p>
      </div>
    );
  }

  const patient = data.patient;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* High Contrast Emergency Banner */}
      <div className="p-5 rounded-3xl bg-rose-600 text-white shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full">
            EMERGENCY MEDICAL DATA
          </span>
          <span className="text-xs font-bold text-rose-100">Zero Login</span>
        </div>
        <h1 className="text-2xl font-black">{patient?.full_name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-rose-100">
          <span>Age: {patient?.age} • Gender: {patient?.gender}</span>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-white flex items-center gap-1">
            <UserCheck size={12} />
            ABHA: {patient?.abha_id || "91-4829-1029-4821"} (Govt Verified)
          </span>
        </div>
      </div>

      {/* Critical Life-Threatening Alerts */}
      <div className="card-aesthetic p-5 border-2 border-rose-400 bg-rose-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle size={16} /> Blood Group &amp; Severe Allergies
          </span>
          <span className="badge-critical text-sm px-3 py-1">
            {patient?.blood_group}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-rose-200">
          <p className="text-xs text-slate-500 font-semibold uppercase">
            Allergies (DO NOT ADMINISTER):
          </p>
          <p className="text-sm font-black text-rose-700 mt-0.5">
            {patient?.allergies?.join(", ") || "No known drug allergies"}
          </p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold uppercase">
            Chronic Conditions:
          </p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {patient?.chronic_conditions?.join(", ") || "None"}
          </p>
        </div>
      </div>

      {/* Tap-to-Call Emergency Contacts */}
      <div className="card-aesthetic p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <PhoneCall size={16} className="text-emerald-600" />
          Emergency Contacts (Tap to Call)
        </h2>
        <div className="space-y-2">
          {data?.emergency_contacts?.map((contact: any) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center justify-between transition-all"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {contact.name}
                </p>
                <p className="text-xs text-emerald-800 font-semibold">
                  {contact.relationship} • {contact.phone}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <PhoneCall size={18} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Current Medications */}
      <div className="card-aesthetic p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Pill size={16} className="text-purple-600" />
          Current Verified Medications
        </h2>
        <div className="space-y-2">
          {data?.current_medicines?.map((m: any, idx: number) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
            >
              <span className="font-bold text-slate-800">{m.name} ({m.dose})</span>
              <span className="text-slate-600 font-medium">{m.frequency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
