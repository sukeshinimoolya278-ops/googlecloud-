"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Check, User, Heart, ShieldAlert, PhoneCall } from "lucide-react";

interface ProfileEditModalProps {
  onClose: () => void;
}

export function ProfileEditModal({ onClose }: ProfileEditModalProps) {
  const { profile, emergencyContacts, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(profile?.full_name || "Ramesh Sharma");
  const [age, setAge] = useState(profile?.age || 62);
  const [gender, setGender] = useState(profile?.gender || "Male");
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || "B+");
  const [allergiesText, setAllergiesText] = useState(profile?.allergies?.join(", ") || "Penicillin, Sulfa drugs");
  const [conditionsText, setConditionsText] = useState(profile?.chronic_conditions?.join(", ") || "Type 2 Diabetes Mellitus, Hypertension");
  
  const primaryContact = emergencyContacts[0] || { name: "Pooja Sharma", phone: "+919811122233", relationship: "Daughter" };
  const [contactName, setContactName] = useState(primaryContact.name);
  const [contactPhone, setContactPhone] = useState(primaryContact.phone);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const allergies = allergiesText.split(",").map((s) => s.trim()).filter(Boolean);
    const conditions = conditionsText.split(",").map((s) => s.trim()).filter(Boolean);

    const updatedContacts = [
      {
        name: contactName,
        phone: contactPhone,
        relationship: "Family",
        is_primary: true,
      },
    ];

    const success = await updateProfile(
      {
        full_name: fullName,
        age: Number(age),
        gender,
        blood_group: bloodGroup,
        allergies,
        chronic_conditions: conditions,
      },
      updatedContacts
    );

    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      alert("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Patient Profile</h2>
              <p className="text-xs text-slate-500">Update medical history &amp; emergency vitals</p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Full Name & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Age</label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Blood Group & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-rose-700 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white"
              >
                {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5 text-rose-700">
              <ShieldAlert size={14} /> Drug Allergies (Comma separated)
            </label>
            <input
              type="text"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa drugs"
              className="w-full p-2.5 rounded-xl border border-rose-300 bg-rose-50/30 font-semibold text-rose-900 focus:ring-2 focus:ring-rose-400 focus:outline-none"
            />
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Chronic Conditions (Comma separated)
            </label>
            <input
              type="text"
              value={conditionsText}
              onChange={(e) => setConditionsText(e.target.value)}
              placeholder="e.g. Type 2 Diabetes, Hypertension"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />
          </div>

          {/* Emergency Contact */}
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
            <label className="block text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
              <PhoneCall size={14} /> Primary Emergency Contact (Tap to Call in Emergency)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Contact Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="p-2 rounded-xl border border-emerald-300 text-xs font-semibold text-slate-800 bg-white"
              />
              <input
                type="text"
                placeholder="Phone (+91...)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="p-2 rounded-xl border border-emerald-300 text-xs font-semibold text-slate-800 bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              <Check size={18} />
              <span>{isSaving ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
