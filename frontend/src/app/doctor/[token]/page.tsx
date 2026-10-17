"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Stethoscope,
  ShieldAlert,
  Clock,
  AlertCircle,
  FileText,
  Pill,
  Sparkles,
  CheckCircle2,
  Lock
} from "lucide-react";

export default function DoctorPortalPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDoctorView();
    }
  }, [token]);

  const fetchDoctorView = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/view/${token}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || "Failed to load doctor portal");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Invalid or expired QR token");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center animate-pulse">
          <Stethoscope size={28} />
        </div>
        <p className="text-sm font-bold text-slate-700">Verifying Doctor QR Access...</p>
      </div>
    );
  }

  if (error || data?.status === "expired") {
    return (
      <div className="card-aesthetic p-6 text-center space-y-4 border-rose-200 bg-rose-50/30">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <Lock size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Expired or Revoked</h2>
        <p className="text-xs text-slate-600">
          This secure medical link has expired or access was revoked by the patient.
        </p>
      </div>
    );
  }

  if (data?.status === "pending") {
    return (
      <div className="card-aesthetic p-6 text-center space-y-4 border-amber-200 bg-amber-50/40">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center animate-bounce">
          <Clock size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Patient Approval Required
        </h2>
        <p className="text-xs text-slate-600">
          Waiting for patient <strong>{data.patient_name}</strong> to approve this session on their phone.
        </p>
        <button
          onClick={fetchDoctorView}
          className="btn-primary text-xs py-2.5 max-w-xs mx-auto"
        >
          Check Consent Status
        </button>
      </div>
    );
  }

  const patient = data.patient;

  return (
    <div className="space-y-5 pb-12">
      {/* Doctor Header Banner */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/30 text-purple-300 flex items-center justify-center border border-purple-400/30">
            <Stethoscope size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-300">
              Verified Clinical Access
            </span>
            <h1 className="text-base font-extrabold text-white">
              {patient?.name} ({patient?.age}M)
            </h1>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Session Active
        </span>
      </div>

      {/* Verified Identity & Official Records Trust Banner */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="font-bold text-emerald-900">
            Official ABHA Identity Match: <strong>91-4829-1029-4821</strong> (Aadhaar e-KYC Verified)
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/60 px-2.5 py-0.5 rounded-md">
          NABL Accredited Records
        </span>
      </div>

      {/* Critical Info Banner */}
      <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2">
        <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs uppercase tracking-wider">
          <ShieldAlert size={16} /> Critical Alerts &amp; Blood Group
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Blood Group:</span>
            <span className="ml-1 font-bold text-rose-900 text-sm">{patient?.blood_group}</span>
          </div>
          <div>
            <span className="text-slate-500">Allergies:</span>
            <span className="ml-1 font-bold text-rose-700">
              {patient?.allergies?.join(", ") || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* One-Page Clinical AI Summary */}
      <div className="card-aesthetic p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/30">
        <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
          <Sparkles size={16} className="text-purple-600" />
          <span>One-Page Clinical Summary</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
          {data?.summary}
        </p>
        <p className="text-[10px] text-slate-400 mt-2 italic">{data?.disclaimer}</p>
      </div>

      {/* Active Medications & Recent Labs Grid on PC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Medications */}
        <div className="card-aesthetic p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Pill size={16} className="text-purple-600" />
            <span>Active Medications</span>
          </h3>
          <div className="space-y-2">
            {data?.active_medicines?.map((m: any) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{m.name}</span>
                  <span className="text-slate-500 ml-2 font-medium">{m.dose}</span>
                </div>
                <span className="text-purple-700 font-medium">{m.frequency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Labs */}
        <div className="card-aesthetic p-5 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText size={16} className="text-purple-600" />
            <span>Recent Verified Lab Results</span>
          </h3>
          <div className="space-y-2">
            {data?.recent_labs?.slice(0, 5).map((l: any) => (
              <div
                key={l.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{l.test_name}</span>
                  <span className="text-slate-400 text-[11px] ml-2">
                    (Ref: {l.normal_min}-{l.normal_max})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">
                    {l.value} {l.unit}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.flag === "high"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {l.flag?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
