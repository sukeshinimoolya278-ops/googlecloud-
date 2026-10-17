"use client";

import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Upload, FileUp, X, AlertCircle, Loader2, Sparkles, Camera, FileText } from "lucide-react";

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (doc: any) => void;
}

export function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("lab_report");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleLoadSample = (type: "lab" | "rx") => {
    let content = "";
    let fileName = "";
    if (type === "lab") {
      fileName = "Apollo_Blood_Glucose_Panel.txt";
      content = `APOLLO CLINICAL DIAGNOSTICS
PATIENT: Ramesh Sharma (62M)
DATE: 2026-10-16
TESTS:
Fasting Blood Sugar: 142.0 mg/dL (Normal: 70-99) [HIGH]
HbA1c: 7.6 % (Normal: 4.0-5.6) [HIGH]
Hemoglobin: 13.5 g/dL (Normal: 12-17.5) [NORMAL]
Serum Creatinine: 1.1 mg/dL (Normal: 0.6-1.3) [NORMAL]`;
      setDocType("lab_report");
    } else {
      fileName = "DrVerma_Cardiology_Rx.txt";
      content = `DR. ARVIND VERMA, MD
PATIENT: Ramesh Sharma
DATE: 2026-10-16
Rx:
1. Metformin (Glycomet) 500mg BID x 60 days
2. Telmisartan 40mg OD x 60 days
3. Dolo 650mg SOS x 3 days`;
      setDocType("prescription");
    }

    const sampleFile = new File([content], fileName, { type: "text/plain" });
    setFile(sampleFile);
    setError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a document or use a sample test file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    try {
      const authToken = token || "demo_jwt_token_123456";
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      onUploadSuccess(data.document);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
              <FileUp size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("uploadReport")}</h2>
              <p className="text-xs text-slate-500">{t("uploadSubtext")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpload} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Samples (For effortless 5-second hackathon live test) */}
          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200/80">
            <span className="block text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600" /> Quick Demo Test (One-Click)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample("lab")}
                className="p-2.5 rounded-xl border border-purple-300 bg-white hover:bg-purple-100/50 text-left text-xs font-bold text-purple-950 transition-all shadow-xs"
              >
                🧪 Sample Lab Report
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample("rx")}
                className="p-2.5 rounded-xl border border-purple-300 bg-white hover:bg-purple-100/50 text-left text-xs font-bold text-purple-950 transition-all shadow-xs"
              >
                💊 Sample Prescription
              </button>
            </div>
          </div>

          {/* Doc Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {t("chooseType")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "lab_report", label: t("labReport"), icon: "🧪" },
                { id: "prescription", label: t("prescription"), icon: "💊" },
                { id: "scan", label: t("scan"), icon: "🩻" },
                { id: "other", label: t("other"), icon: "📄" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setDocType(item.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border text-sm font-semibold transition-all ${
                    docType === item.id
                      ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Drag / Camera Zone */}
          <div>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-2xl p-5 bg-slate-50 hover:bg-purple-50/30 cursor-pointer transition-all text-center"
            >
              <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-2 shadow-inner">
                {file ? <FileText size={22} /> : <Camera size={22} />}
              </div>
              <p className="text-sm font-bold text-slate-800">
                {file ? file.name : "Or choose custom file / snap photo"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                PDF, JPG, PNG (Max 10MB) • SHA-256 Protected
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading || !file}
              className="btn-primary"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Extracting with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Start AI Extraction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
