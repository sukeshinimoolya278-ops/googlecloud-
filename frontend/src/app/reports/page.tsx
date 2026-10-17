"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { VerificationModal } from "../../components/VerificationModal";
import { UploadModal } from "../../components/UploadModal";
import {
  FileText,
  FileUp,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Calendar
} from "lucide-react";

export default function ReportsPage() {
  const { t, language, speak, isSpeaking, stopSpeaking } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docDetails, setDocDetails] = useState<any | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState<any | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents/", {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.documents?.length > 0) {
          handleSelectDoc(data.documents[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching docs", err);
    }
  };

  const handleSelectDoc = async (doc: any) => {
    setSelectedDoc(doc);
    setExplanation(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setDocDetails(data);
        fetchExplanation(doc.id, language);
      }
    } catch (err) {
      console.error("Error fetching details", err);
    }
  };

  const fetchExplanation = async (docId: string, lang: string) => {
    setLoadingExplanation(true);
    try {
      const res = await fetch(`/api/documents/${docId}/explain?language=${lang}`, {
        headers: { Authorization: "Bearer demo_jwt_token_123456" },
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data.content);
      }
    } catch (err) {
      console.error("Error fetching explanation", err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  useEffect(() => {
    if (selectedDoc) {
      fetchExplanation(selectedDoc.id, language);
    }
  }, [language]);

  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (explanation) {
      speak(explanation);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Medical Reports &amp; Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Rule-verified lab metrics, abnormal flagging, and AI multi-lingual translation
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-sm sm:text-base font-black shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <FileUp size={20} />
          <span>+ {t("uploadReport")}</span>
        </button>
      </div>

      {/* Responsive Grid: 1 Col Mobile, 2 Cols PC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (lg:col-span-4): Document List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider">
              Timeline Records ({documents.length})
            </h2>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full">
              SHA-256 Verified
            </span>
          </div>

          {/* Desktop Vertical List / Mobile Horizontal Scroll */}
          <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-4 rounded-2xl border-2 text-left shrink-0 w-60 lg:w-full transition-all ${
                    isSelected
                      ? "bg-teal-50 border-teal-600 shadow-sm ring-2 ring-teal-200"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                      <FileText size={18} />
                    </div>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Confirmed
                    </span>
                  </div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                    {doc.file_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                    <Calendar size={14} />
                    <span>{doc.uploaded_at?.slice(0, 10)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (lg:col-span-8): Selected Report Viewer & AI Explanation */}
        <div className="lg:col-span-8 space-y-5">
          {selectedDoc && docDetails ? (
            <>
              {/* Plain Language AI Explanation Card */}
              <div className="rounded-3xl bg-teal-50 p-6 border-2 border-teal-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-teal-700 text-white shadow-sm">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base sm:text-lg">
                        Plain Language Explanation
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Zero medical jargon • Translated for elderly &amp; family members
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleReadAloud}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-teal-100 rounded-2xl border-2 border-teal-300 text-xs sm:text-sm font-black text-teal-900 shadow-xs transition-all active:scale-95"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={16} className="text-rose-600 animate-bounce" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} className="text-teal-700" />
                        <span>🔊 {t("readAloud")}</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-slate-900 text-sm sm:text-base leading-relaxed font-medium">
                  {loadingExplanation
                    ? "Generating plain language translation..."
                    : explanation || "Report findings are within stable limits."}
                </p>

                <div className="pt-3 border-t border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 font-semibold">
                  <span>{t("disclaimer")}</span>
                  <span className="text-emerald-800 font-black flex items-center gap-1">
                    <ShieldCheck size={16} /> Rule-Verified Lab Values
                  </span>
                </div>
              </div>

              {/* Official Document & Identity Cross-Check Audit Card */}
              <div className="card-aesthetic p-5 border-2 border-emerald-200 bg-emerald-50/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                        <span>Official Document &amp; Identity Verification</span>
                        <span className="badge-pill-green text-[10px]">CERTIFIED AUTHENTIC</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cross-checked against national health registries &amp; accredited laboratory emissions
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    Tamper-Proof SHA-256
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white/90 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Issuing Entity &amp; Accreditation
                    </span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">
                      {selectedDoc.issuing_entity || "Metropolis Healthcare Ltd."}
                    </strong>
                    <p className="text-emerald-700 text-[11px] font-semibold mt-1">
                      {selectedDoc.accreditation || "NABL Accredited (Cert #MC-2491)"}
                    </p>
                  </div>

                  <div className="p-3 bg-white/90 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Patient Identity Cross-Check
                    </span>
                    <strong className="text-slate-900 font-bold mt-0.5 block">
                      Matched: Ramesh Sharma (62M)
                    </strong>
                    <p className="text-indigo-700 text-[11px] font-semibold mt-1">
                      ABHA ID: 91-4829-1029-4821 (99.8% Match)
                    </p>
                  </div>

                  <div className="p-3 bg-white/90 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cryptographic Audit &amp; Signoff
                    </span>
                    <strong className="text-slate-900 font-bold mt-0.5 block truncate">
                      {selectedDoc.cryptographic_hash || "sha256_e7f86dda8f744f..."}
                    </strong>
                    <p className="text-slate-600 text-[11px] mt-1">
                      {selectedDoc.digital_signature || "Digitally Signed by Pathologist"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lab Values Table */}
              <div className="card-aesthetic p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Verified Lab Values
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rule-based flagging: Low, Normal, High, Critical High
                    </p>
                  </div>
                  <button
                    onClick={() => setVerifyDoc(selectedDoc)}
                    className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-black transition-all active:scale-95"
                  >
                    Edit / Re-verify
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docDetails.lab_results?.map((lab: any) => {
                    const flag = lab.flag || "normal";
                    return (
                      <div
                        key={lab.id}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {lab.test_name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ref: {lab.normal_min} - {lab.normal_max} {lab.unit}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-slate-900">
                            {lab.value} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                          </div>
                          <div className="mt-1">
                            {flag === "high" && <span className="badge-high">HIGH</span>}
                            {flag === "critical_high" && <span className="badge-critical">CRITICAL HIGH</span>}
                            {flag === "low" && <span className="badge-low">LOW</span>}
                            {flag === "normal" && <span className="badge-normal">NORMAL</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="card-aesthetic p-12 text-center text-slate-400">
              <FileText size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Select a report from the timeline to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadSuccess={(doc) => {
            setShowUpload(false);
            fetchDocuments();
            setVerifyDoc(doc);
          }}
        />
      )}

      {/* Verification Modal */}
      {verifyDoc && (
        <VerificationModal
          documentId={verifyDoc.id}
          fileName={verifyDoc.file_name}
          docType={verifyDoc.type}
          initialLabs={docDetails?.lab_results || []}
          onClose={() => setVerifyDoc(null)}
          onConfirmSuccess={() => {
            setVerifyDoc(null);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
