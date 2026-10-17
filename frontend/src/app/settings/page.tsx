"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Phone,
  Mail,
  Shield,
  HeartPulse,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  ExternalLink,
  RefreshCw,
  Globe,
  KeyRound,
  ShieldAlert,
  Calendar,
  Camera,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const {
    profile,
    emergencyContacts,
    isAuthenticated,
    isLoading,
    updateProfile,
    linkGoogleAccount,
    deleteAccount,
    logout,
  } = useAuth();

  // Redirect if not signed in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Section 1: Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [gender, setGender] = useState(profile?.gender || "Prefer not to say");
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || "Unknown");
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || "");
  const [language, setLanguage] = useState(profile?.preferred_language || "en");
  const [abhaId, setAbhaId] = useState(profile?.abha_id || "");

  // Section 3: Emergency contact state
  const primaryContact = emergencyContacts[0] || { name: "", relationship: "Daughter", phone: "" };
  const [contactName, setContactName] = useState(primaryContact.name || "");
  const [contactRelation, setContactRelation] = useState(primaryContact.relationship || "Daughter");
  const [contactPhone, setContactPhone] = useState(primaryContact.phone || "");

  // Section 4: Allergies & Chronic conditions tags
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [newAllergy, setNewAllergy] = useState("");
  const [conditions, setConditions] = useState<string[]>(profile?.chronic_conditions || []);
  const [newCondition, setNewCondition] = useState("");

  // Section 5: Active Shares
  const [shares, setShares] = useState<any[]>([]);
  const [loadingShares, setLoadingShares] = useState(true);

  // Status & Confirmation modals
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDob(profile.dob || "");
      setGender(profile.gender || "Prefer not to say");
      setBloodGroup(profile.blood_group || "Unknown");
      setPhotoUrl(profile.photo_url || "");
      setLanguage(profile.preferred_language || "en");
      setAbhaId(profile.abha_id || "");
      setAllergies(profile.allergies || []);
      setConditions(profile.chronic_conditions || []);
    }
    if (emergencyContacts.length > 0) {
      setContactName(emergencyContacts[0].name || "");
      setContactRelation(emergencyContacts[0].relationship || "Daughter");
      setContactPhone(emergencyContacts[0].phone || "");
    }
  }, [profile, emergencyContacts]);

  // Load Active QR Shares
  useEffect(() => {
    const fetchShares = async () => {
      try {
        const res = await fetch("/api/auth/qr-shares");
        if (res.ok) {
          const data = await res.json();
          setShares(data.shares || []);
        }
      } catch (err) {
        console.error("Failed to load shares", err);
      } finally {
        setLoadingShares(false);
      }
    };
    if (isAuthenticated) {
      fetchShares();
    }
  }, [isAuthenticated]);

  // Compute Age from DOB
  const calculateAge = (dobString: string): number => {
    if (!dobString) return profile?.age || 0;
    try {
      const birth = new Date(dobString);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : 0;
    } catch {
      return 0;
    }
  };

  // Add Allergy Tag
  const handleAddAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (tag: string) => {
    setAllergies(allergies.filter((a) => a !== tag));
  };

  // Add Condition Tag
  const handleAddCondition = () => {
    const trimmed = newCondition.trim();
    if (trimmed && !conditions.includes(trimmed)) {
      setConditions([...conditions, trimmed]);
      setNewCondition("");
    }
  };

  const handleRemoveCondition = (tag: string) => {
    setConditions(conditions.filter((c) => c !== tag));
  };

  // Save All Profile Settings
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    // Validate NO Aadhaar
    if (abhaId) {
      const digitsOnly = abhaId.replace(/\D/g, "");
      if (digitsOnly.length === 12) {
        setErrorMessage("Aadhaar numbers must never be stored. Please provide a 14-digit ABHA ID instead.");
        setSaving(false);
        return;
      }
    }

    const age = calculateAge(dob);

    const updatedContacts = contactName.trim() && contactPhone.trim() ? [
      {
        id: emergencyContacts[0]?.id || "ec-1",
        name: contactName.trim(),
        relationship: contactRelation,
        phone: contactPhone.trim(),
        is_primary: true,
      }
    ] : emergencyContacts;

    const ok = await updateProfile(
      {
        full_name: fullName.trim() || "Patient",
        dob,
        age,
        gender,
        blood_group: bloodGroup,
        photo_url: photoUrl,
        preferred_language: language,
        allergies,
        chronic_conditions: conditions,
        abha_id: abhaId.trim(),
      },
      updatedContacts
    );

    setSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage("Failed to save changes. Please try again.");
    }
  };

  // Link Missing Google Account
  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    setErrorMessage(null);
    const res = await linkGoogleAccount();
    setLinkingGoogle(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Revoke QR Share Token
  const handleRevokeShare = async (token: string) => {
    try {
      await fetch(`/api/auth/qr-shares/${token}`, { method: "DELETE" });
      setShares(shares.filter((s) => s.token !== token));
    } catch (err) {
      console.error("Failed to revoke share", err);
    }
  };

  // Danger Zone: Confirm Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete my account") {
      setErrorMessage("Please type 'delete my account' to confirm.");
      return;
    }
    setDeleting(true);
    const res = await deleteAccount("User requested deletion");
    setDeleting(false);
    if (res.success) {
      router.push("/login");
    } else {
      setErrorMessage(res.error || "Failed to delete account. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw size={36} className="text-purple-600 animate-spin" />
      </div>
    );
  }

  const verifiedMethods = profile?.verified_methods || ["phone"];
  const hasPhone = !!profile?.phone || verifiedMethods.includes("phone");
  const hasGoogle = !!profile?.email || verifiedMethods.includes("google");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <User size={28} className="text-purple-600" />
            <span>Account Settings</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your personal profile, emergency lifeline, and security.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-base shadow-md shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {/* Global Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>All profile and emergency settings have been saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-sm font-bold flex items-start gap-2.5 animate-fade-in shadow-xs">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: PROFILE DETAILS                                    */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User size={22} className="text-purple-600" />
            <span>1. Patient Profile</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your personal clinical identification details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="w-full text-base sm:text-lg font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none"
            />
          </div>

          {/* Date of Birth & Auto Age */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-purple-600" />
                Date of Birth
              </span>
              {dob && (
                <span className="text-purple-700 font-extrabold text-xs bg-purple-50 px-2 py-0.5 rounded-full">
                  Age: {calculateAge(dob)} years
                </span>
              )}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 outline-none"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 outline-none bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1 text-rose-700">
              <Shield size={14} />
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full text-base font-extrabold px-4 py-3 rounded-2xl border-2 border-rose-200 bg-rose-50/50 text-rose-900 focus:border-rose-600 outline-none"
            >
              <option value="Unknown">Unknown / Not Tested</option>
              <option value="A+">A+ (A Positive)</option>
              <option value="A-">A- (A Negative)</option>
              <option value="B+">B+ (B Positive)</option>
              <option value="B-">B- (B Negative)</option>
              <option value="AB+">AB+ (AB Positive)</option>
              <option value="AB-">AB- (AB Negative)</option>
              <option value="O+">O+ (O Positive)</option>
              <option value="O-">O- (O Negative)</option>
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe size={14} className="text-purple-600" />
              Explanation Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 outline-none bg-white"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Optional Photo URL / Avatar */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Camera size={14} className="text-purple-600" />
              Profile Photo URL (Optional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full text-sm font-medium px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-purple-600 outline-none"
            />
          </div>

          {/* ABHA ID (Optional text field - explicitly NOT Aadhaar) */}
          <div className="sm:col-span-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Government ABHA ID (Ayushman Bharat)</span>
                <span className="badge-pill-purple text-[10px] py-0.5 px-2">Verification coming soon</span>
              </label>
            </div>
            <input
              type="text"
              value={abhaId}
              onChange={(e) => setAbhaId(e.target.value)}
              placeholder="e.g. 91-4829-1029-4821"
              className="w-full text-base font-semibold px-4 py-2.5 rounded-xl border border-purple-200 bg-white focus:border-purple-600 outline-none"
            />
            <p className="text-[11px] text-purple-800/80 mt-1.5 flex items-center gap-1">
              <ShieldAlert size={12} className="text-purple-600 shrink-0" />
              <span><strong>Privacy Notice:</strong> Do NOT enter your Aadhaar number. Only 14-digit ABHA health IDs are accepted.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: VERIFIED CONTACT METHODS                           */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound size={22} className="text-purple-600" />
            <span>2. Verified Sign-In Methods</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your linked credentials. You can link both Phone and Google to your account.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Phone Method */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Phone size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {profile?.phone || "No phone linked"}
                </div>
                <div className="text-xs text-slate-500">Phone Authentication (SMS OTP)</div>
              </div>
            </div>

            {hasPhone ? (
              <span className="badge-pill-green flex items-center gap-1 self-start sm:self-center">
                <CheckCircle2 size={13} />
                <span>Verified</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all self-start sm:self-center"
              >
                Link Phone
              </button>
            )}
          </div>

          {/* Google Method */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Mail size={20} className="text-slate-700" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {profile?.email || "No Google account linked"}
                </div>
                <div className="text-xs text-slate-500">Google Account (Gmail)</div>
              </div>
            </div>

            {hasGoogle ? (
              <span className="badge-pill-green flex items-center gap-1 self-start sm:self-center">
                <CheckCircle2 size={13} />
                <span>Verified</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={linkingGoogle}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 transition-all self-start sm:self-center flex items-center gap-1.5"
              >
                {linkingGoogle && <RefreshCw size={12} className="animate-spin" />}
                <span>Link Google Account</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: EMERGENCY CONTACT                                 */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 text-rose-700">
            <ShieldAlert size={22} className="text-rose-600" />
            <span>3. Emergency Contact (One-Tap Dial)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            This person will be called directly when your Emergency QR code is scanned.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contact Name *
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Pooja Sharma"
              className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-rose-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Relationship
            </label>
            <select
              value={contactRelation}
              onChange={(e) => setContactRelation(e.target.value)}
              className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-rose-600 outline-none bg-white"
            >
              <option value="Daughter">Daughter</option>
              <option value="Son">Son</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Doctor">Doctor</option>
              <option value="Friend">Friend / Neighbour</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98111 22233"
              className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-rose-600 outline-none"
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4: ALLERGIES & CHRONIC CONDITIONS                     */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HeartPulse size={22} className="text-purple-600" />
            <span>4. Allergies & Chronic Conditions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            These critical badges feed the Emergency QR view for first responders.
          </p>
        </div>

        {/* Allergies Tags */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider">
            Critical Drug & Food Allergies
          </label>
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-rose-100 text-rose-800 font-bold text-sm border border-rose-200"
              >
                <span>{allergy}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAllergy(allergy)}
                  className="hover:bg-rose-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAllergy())}
              placeholder="e.g. Penicillin, Peanuts, Sulfa"
              className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
            />
            <button
              type="button"
              onClick={handleAddAllergy}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all flex items-center gap-1"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Chronic Conditions Tags */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider">
            Chronic Medical Conditions
          </label>
          <div className="flex flex-wrap gap-2">
            {conditions.map((cond) => (
              <span
                key={cond}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-100 text-purple-800 font-bold text-sm border border-purple-200"
              >
                <span>{cond}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(cond)}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCondition())}
              placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
              className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
            />
            <button
              type="button"
              onClick={handleAddCondition}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all flex items-center gap-1"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5: SECURITY & ACTIVE SHARES                          */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield size={22} className="text-purple-600" />
            <span>5. Security & Active QR Share Sessions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active QR codes and clinical access links granted to doctors or clinics.
          </p>
        </div>

        {/* List of active shares */}
        <div className="space-y-3">
          {shares.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm font-medium">
              No active doctor access sessions.
            </div>
          ) : (
            shares.map((share) => (
              <div
                key={share.token}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{share.label}</span>
                    <span className="badge-pill-green text-[10px] py-0 px-2">Active</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    Token: {share.token.slice(0, 16)}...
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleRevokeShare(share.token)}
                    className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Log Out Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm">Sign Out of Health Vault</div>
            <div className="text-xs text-slate-500">You will need to sign in with OTP or Google next time.</div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 6: DANGER ZONE                                       */}
      {/* ============================================================ */}
      <section className="bg-rose-50/70 p-6 sm:p-8 rounded-3xl border-2 border-rose-200 space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <Trash2 size={24} className="text-rose-600" />
          <h2 className="text-xl font-black tracking-tight">6. Danger Zone</h2>
        </div>
        <p className="text-sm text-rose-900/80">
          Permanently delete your Health Vault account, profile information, and all stored lab reports & prescriptions. This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md shadow-rose-600/20 transition-all active:scale-95"
        >
          <Trash2 size={16} />
          <span>Delete My Account & Health Data</span>
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 size={30} />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Permanently Delete Account?</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                This will delete your emergency QR access, medical reports, prescriptions, and cryptographic audit records.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Type <strong className="text-rose-600 font-black">delete my account</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                className="w-full text-base font-semibold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-rose-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText.toLowerCase() !== "delete my account"}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {deleting && <RefreshCw size={14} className="animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
