"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  QrCode,
  ShieldAlert,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  History,
  Lock,
  PhoneCall,
  ShieldCheck,
  Smartphone
} from "lucide-react";

export default function QRPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"doctor" | "emergency" | "consent" | "logs">("doctor");
  const [tokens, setTokens] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    // Check URL parameters if tab is specified
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab") as any;
      if (tabParam && ["doctor", "emergency", "consent", "logs"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
    fetchTokens();
    fetchRequests();
    fetchLogs();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch("/api/qr/tokens", {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (err) {
      console.error("Error fetching tokens", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/qr/requests", {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching requests", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/qr/logs", {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching logs", err);
    }
  };

  const handleRegenerate = async (type: "full" | "emergency") => {
    if (!confirm("Are you sure? Old QR code will stop working immediately.")) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/qr/regenerate?token_type=${type}`, {
        method: "POST",
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        await fetchTokens();
        await fetchLogs();
        alert("New secure QR token generated successfully!");
      }
    } catch (err) {
      console.error("Regenerate failed", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleConsent = async (requestId: string, action: "approved" | "denied", durationHours: number = 24) => {
    try {
      const res = await fetch("/api/qr/requests/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer demo_jwt_token_123456",
        },
        body: JSON.stringify({
          request_id: requestId,
          action,
          duration_hours: durationHours,
        }),
      });
      if (res.ok) {
        fetchRequests();
        fetchLogs();
      }
    } catch (err) {
      console.error("Consent response failed", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Security &amp; QR Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Encrypted URL tokens, patient consent gating, and zero-login emergency access
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto max-w-xl">
        <button
          onClick={() => setActiveTab("doctor")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "doctor"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Doctor QR
        </button>
        <button
          onClick={() => setActiveTab("emergency")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "emergency"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Emergency QR
        </button>
        <button
          onClick={() => setActiveTab("consent")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 relative ${
            activeTab === "consent"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Consent Manager
          {requests.some((r) => r.status === "pending") && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "logs"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Tab 1: Doctor QR Code (Responsive Split on PC) */}
      {activeTab === "doctor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* QR Card (lg:col-span-5) */}
          <div className="lg:col-span-5 card-aesthetic p-6 sm:p-8 flex flex-col items-center text-center">
            <span className="badge-pill-indigo mb-3">
              Doctor Access Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Consent-Locked Doctor QR
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Encodes only a random unguessable URL token. No raw clinical data is ever stored inside the QR.
            </p>

            {/* QR Image Box */}
            <div className="my-6 p-4 sm:p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-xl">
              <img
                src="/api/qr/image/full"
                alt="Doctor Access QR"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full max-w-sm">
              <a
                href="/api/qr/image/full"
                download="Doctor_Health_QR.png"
                className="btn-primary text-xs sm:text-sm py-3 flex-1"
              >
                <Download size={18} /> Download QR
              </a>
              <button
                onClick={() => handleRegenerate("full")}
                disabled={isRegenerating}
                className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-all shadow-xs"
                title="Revoke &amp; Regenerate Token"
              >
                <RefreshCw size={18} className={isRegenerating ? "animate-spin" : ""} />
              </button>
            </div>

            {tokens?.doctor_url && (
              <a
                href={tokens.doctor_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1.5"
              >
                <span>Simulate Doctor Scanning (Opens Portal)</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Right Explainer / Consent Summary (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card-aesthetic p-6 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <ShieldCheck size={22} className="text-emerald-600" />
                <span>How Doctor Consent Works</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When an attending physician or hospital clinic scans this QR, their browser establishes a temporary connection. Your phone receives an approval notification. Only when you approve does the doctor see your medical records.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-purple-700 text-sm">1. Scan</span>
                  <p className="text-xs text-slate-500 mt-1">Doctor scans token from any camera.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-purple-700 text-sm">2. Consent</span>
                  <p className="text-xs text-slate-500 mt-1">Patient approves for 1h, 24h, or 7d.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-purple-700 text-sm">3. Auto Expiry</span>
                  <p className="text-xs text-slate-500 mt-1">Access automatically locks after expiry.</p>
                </div>
              </div>
            </div>

            {/* Quick Pending Requests widget */}
            <div className="card-aesthetic p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-base">
                  Active Doctor Sessions
                </h4>
                <button
                  onClick={() => setActiveTab("consent")}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  Manage all
                </button>
              </div>

              {requests.slice(0, 2).map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{req.requester_label}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Status: <strong className="text-emerald-700">{req.status.toUpperCase()}</strong>
                    </p>
                  </div>
                  <span className="text-slate-500 font-medium">
                    {req.status === "approved" ? "Active" : "Awaiting approval"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Emergency QR Code & Lockscreen Card */}
      {activeTab === "emergency" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Emergency Card (lg:col-span-5) */}
          <div className="lg:col-span-5 card-aesthetic p-6 sm:p-8 border-rose-200 bg-rose-50/20 flex flex-col items-center text-center">
            <span className="badge-critical mb-3">
              ZERO-LOGIN LIFELINE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Emergency Responder QR
            </h2>
            <p className="text-xs text-slate-600 max-w-xs mt-1">
              For first responders, EMTs, and casualty triage. Opens with zero password.
            </p>

            <div className="my-6 p-4 sm:p-6 bg-white rounded-3xl border-2 border-rose-300 shadow-xl">
              <img
                src="/api/qr/image/emergency"
                alt="Emergency QR"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
              />
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-sm">
              <a
                href="/api/qr/emergency-card"
                download="Emergency_Lockscreen_Card.png"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <Download size={18} /> Download Phone Lock-Screen Card
              </a>
              {tokens?.emergency_url && (
                <a
                  href={tokens.emergency_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-rose-700 hover:underline flex items-center justify-center gap-1.5 mt-1"
                >
                  <span>Preview Public Emergency Page</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Right Side: Emergency Info Preview (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card-aesthetic p-6 border-l-4 border-rose-500 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Why Keep This on Your Phone Lock-Screen?
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                If an accident happens or a patient is unconscious, paramedics and hospital triage can scan the QR right off the phone screen without needing your PIN or fingerprint.
              </p>
            </div>

            <div className="card-aesthetic p-6 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-base">
                What Responders Will See:
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">Ramesh Sharma (62M)</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl flex justify-between text-rose-900">
                  <span className="font-medium">Blood Group:</span>
                  <span className="font-black text-sm">B+</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl flex justify-between text-rose-900">
                  <span className="font-medium">Severe Allergies:</span>
                  <span className="font-bold">Penicillin, Sulfa drugs</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl flex justify-between text-emerald-900">
                  <span className="font-medium">Primary Contact:</span>
                  <span className="font-bold">Pooja Sharma (+919811122233)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Consent Manager */}
      {activeTab === "consent" && (
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Doctor Access Approvals
          </h2>

          {requests.map((req) => {
            const isApproved = req.status === "approved";
            return (
              <div
                key={req.id}
                className="card-aesthetic p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {req.requester_label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested on: {req.created_at?.slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full self-start sm:self-auto ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isApproved ? "Approved (Active)" : "Pending Patient Approval"}
                  </span>
                </div>

                {isApproved ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 font-medium">
                    <span>
                      Active session valid for {req.duration_hours || 24} hours. Doctor can view medications and lab timeline.
                    </span>
                    <button
                      onClick={() => handleConsent(req.id, "denied")}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shrink-0 transition-all"
                    >
                      Revoke Access Now
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleConsent(req.id, "denied")}
                      className="btn-secondary text-xs sm:text-sm py-3 flex-1"
                    >
                      <XCircle size={18} /> Deny Request
                    </button>
                    <button
                      onClick={() => handleConsent(req.id, "approved", 24)}
                      className="btn-primary text-xs sm:text-sm py-3 flex-1"
                    >
                      <CheckCircle size={18} /> Allow For 24 Hours
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Access Audit Log */}
      {activeTab === "logs" && (
        <div className="space-y-4 max-w-4xl">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Patient Security &amp; Access Log ({logs.length})
          </h2>
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="card-aesthetic p-4 flex items-center justify-between text-xs sm:text-sm"
              >
                <div className="space-y-1">
                  <div className="font-extrabold text-slate-900">
                    {log.requester_label}
                  </div>
                  <div className="text-xs text-slate-400">
                    IP Hash: {log.ip_hash} • Timestamp: {log.timestamp?.slice(0, 16).replace("T", " ")}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    log.access_type === "emergency_view"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {log.access_type.replace("_", " ").toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
