"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  linkWithPopup,
  linkWithPhoneNumber,
  deleteUser,
  RecaptchaVerifier,
  ConfirmationResult,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import { EmergencyContact, Profile } from "../lib/mockStore";

interface AuthContextType {
  token: string | null;
  firebaseUser: FirebaseUser | null;
  profile: Profile | null;
  emergencyContacts: EmergencyContact[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseReady: boolean;
  hasCompletedOnboarding: boolean;
  // Auth actions
  sendPhoneOtp: (phoneNumber: string, appVerifier?: any) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<{ status: string; demo_hint?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  loginWithGoogle: (emailOverride?: string) => Promise<boolean>;
  loginAsDemo: () => Promise<void>;
  // Account linking
  linkGoogleAccount: (emailOverride?: string) => Promise<{ success: boolean; error?: string }>;
  linkPhoneNumber: (phoneNumber: string, appVerifier?: any) => Promise<ConfirmationResult>;
  confirmPhoneLink: (confirmationResult: ConfirmationResult, otp: string) => Promise<{ success: boolean; error?: string }>;
  // Profile & settings
  updateProfile: (updated: Partial<Profile>, contacts?: EmergencyContact[]) => Promise<boolean>;
  completeOnboarding: (data: Partial<Profile>, contacts?: EmergencyContact[]) => Promise<boolean>;
  deleteAccount: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  firebaseUser: null,
  profile: null,
  emergencyContacts: [],
  isAuthenticated: false,
  isLoading: true,
  isFirebaseReady: false,
  hasCompletedOnboarding: true,
  sendPhoneOtp: async () => { throw new Error("Not implemented"); },
  verifyPhoneOtp: async () => false,
  sendOtp: async () => ({ status: "success" }),
  verifyOtp: async () => false,
  loginWithGoogle: async () => false,
  loginAsDemo: async () => {},
  linkGoogleAccount: async () => ({ success: false }),
  linkPhoneNumber: async () => { throw new Error("Not implemented"); },
  confirmPhoneLink: async () => ({ success: false }),
  updateProfile: async () => false,
  completeOnboarding: async () => false,
  deleteAccount: async () => ({ success: false }),
  refreshProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Sync session with backend using verified ID token
  const syncWithBackend = useCallback(async (authToken: string, userDetails?: { phone?: string | null; email?: string | null; name?: string | null }) => {
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          phone: userDetails?.phone,
          email: userDetails?.email,
          name: userDetails?.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setEmergencyContacts(data.emergency_contacts || []);
        return data.profile;
      }
    } catch (err) {
      console.warn("Backend sync fallback active", err);
    }

    // Fallback profile load
    try {
      const profileRes = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setEmergencyContacts(data.emergency_contacts || []);
        return data.profile;
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    }
    return null;
  }, []);

  // Monitor Firebase Auth state
  useEffect(() => {
    setIsFirebaseReady(isFirebaseConfigured());

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          localStorage.setItem("qr_health_token", idToken);
          await syncWithBackend(idToken, {
            phone: user.phoneNumber,
            email: user.email,
            name: user.displayName,
          });
        } catch (err) {
          console.error("Error fetching Firebase ID token", err);
        }
      } else {
        setFirebaseUser(null);
        // Check if a saved token exists
        const savedToken = localStorage.getItem("qr_health_token");
        if (savedToken) {
          setToken(savedToken);
          await syncWithBackend(savedToken);
        } else {
          setToken(null);
          setProfile(null);
          setEmergencyContacts([]);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  // Phone OTP Flow
  const sendPhoneOtp = async (phoneNumber: string, appVerifier?: RecaptchaVerifier): Promise<ConfirmationResult> => {
    if (isFirebaseConfigured() && appVerifier) {
      return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    }

    // Local / Dev Fallback ConfirmationResult
    return {
      verificationId: "mock_verification_id",
      confirm: async (verificationCode: string) => {
        if (verificationCode.trim() === "123456" || verificationCode.trim().length === 6) {
          const mockToken = `demo_jwt_token_123456`;
          setToken(mockToken);
          localStorage.setItem("qr_health_token", mockToken);
          await syncWithBackend(mockToken, { phone: phoneNumber });
          return {
            user: {
              uid: "00000000-0000-0000-0000-000000000001",
              phoneNumber,
              getIdToken: async () => mockToken,
            } as any,
          } as any;
        }
        const err: any = new Error("Invalid verification code");
        err.code = "auth/invalid-verification-code";
        throw err;
      },
    };
  };

  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, otp: string): Promise<boolean> => {
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;
      setFirebaseUser(user);
      const idToken = await user.getIdToken();
      setToken(idToken);
      localStorage.setItem("qr_health_token", idToken);
      await syncWithBackend(idToken, {
        phone: user.phoneNumber,
        name: user.displayName,
      });
      return true;
    } catch (err: any) {
      console.error("OTP verification error:", err.code || err.message);
      throw err;
    }
  };

  // Google Login Flow
  const loginWithGoogle = async (emailOverride?: string): Promise<boolean> => {
    // If user provided a specific Gmail address
    if (emailOverride && emailOverride.trim()) {
      const email = emailOverride.trim().toLowerCase();
      const rawName = email.split("@")[0].replace(/[._-]/g, " ");
      const name = rawName.replace(/\b\w/g, (l) => l.toUpperCase());
      const demoToken = `token_gmail_${Date.now()}`;
      setToken(demoToken);
      localStorage.setItem("qr_health_token", demoToken);
      await syncWithBackend(demoToken, {
        email,
        name: name || "Google User",
      });
      return true;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFirebaseUser(user);
      const idToken = await user.getIdToken();
      setToken(idToken);
      localStorage.setItem("qr_health_token", idToken);
      await syncWithBackend(idToken, {
        email: user.email,
        name: user.displayName,
        phone: user.phoneNumber,
      });
      return true;
    } catch (err: any) {
      console.warn("Google popup notice:", err.code || err.message);
      throw err;
    }
  };

  // Demo Login (Instant for Hackathon Reviewers)
  const loginAsDemo = async () => {
    const demoToken = "demo_jwt_token_123456";
    setToken(demoToken);
    localStorage.setItem("qr_health_token", demoToken);
    await syncWithBackend(demoToken, {
      phone: "+919876543210",
      email: "ramesh.sharma@example.com",
      name: "Ramesh Sharma",
    });
  };

  // Link Google Account to existing user
  const linkGoogleAccount = async (emailOverride?: string): Promise<{ success: boolean; error?: string }> => {
    if (emailOverride && emailOverride.trim()) {
      const email = emailOverride.trim().toLowerCase();
      const currentToken = token || localStorage.getItem("qr_health_token") || "demo_jwt_token_123456";
      await syncWithBackend(currentToken, { email });
      return { success: true };
    }

    if (!auth.currentUser) {
      return { success: false, error: "No active Firebase session. Please enter your Gmail address." };
    }
    try {
      await linkWithPopup(auth.currentUser, googleProvider);
      const idToken = await auth.currentUser.getIdToken(true);
      await syncWithBackend(idToken, { email: auth.currentUser.email });
      return { success: true };
    } catch (err: any) {
      if (err.code === "auth/credential-already-in-use") {
        return {
          success: false,
          error: "This Google account is already linked to another Health Vault profile.",
        };
      }
      return { success: false, error: err.message || "Failed to link Google account." };
    }
  };

  // Link Phone Number to existing user
  const linkPhoneNumber = async (phoneNumber: string, appVerifier?: any): Promise<ConfirmationResult> => {
    if (!auth.currentUser) {
      throw new Error("No active user session to link phone number.");
    }
    if (isFirebaseConfigured() && appVerifier) {
      return await linkWithPhoneNumber(auth.currentUser, phoneNumber, appVerifier);
    }
    return {
      verificationId: "mock_link_id",
      confirm: async (code: string) => {
        if (code === "123456") {
          return { user: auth.currentUser } as any;
        }
        throw new Error("Invalid verification code");
      },
    };
  };

  const confirmPhoneLink = async (confirmationResult: ConfirmationResult, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await confirmationResult.confirm(otp);
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken(true);
        await syncWithBackend(idToken, { phone: auth.currentUser.phoneNumber });
      }
      return { success: true };
    } catch (err: any) {
      if (err.code === "auth/credential-already-in-use") {
        return {
          success: false,
          error: "This phone number is already registered to another Health Vault account.",
        };
      }
      return { success: false, error: err.message || "Failed to link phone number." };
    }
  };

  // Profile Updates
  const updateProfile = async (
    updated: Partial<Profile>,
    contacts?: EmergencyContact[]
  ): Promise<boolean> => {
    const currentToken = token || localStorage.getItem("qr_health_token");
    if (!currentToken) return false;

    try {
      const payload = {
        full_name: updated.full_name || profile?.full_name || "Patient",
        dob: updated.dob || profile?.dob || "",
        age: updated.age !== undefined ? updated.age : profile?.age || 0,
        gender: updated.gender || profile?.gender || "Prefer not to say",
        blood_group: updated.blood_group || profile?.blood_group || "Unknown",
        photo_url: updated.photo_url || profile?.photo_url || "",
        preferred_language: updated.preferred_language || profile?.preferred_language || "en",
        allergies: updated.allergies || profile?.allergies || [],
        chronic_conditions: updated.chronic_conditions || profile?.chronic_conditions || [],
        abha_id: updated.abha_id !== undefined ? updated.abha_id : profile?.abha_id || "",
        emergency_contacts: contacts || emergencyContacts,
        onboarding_completed: updated.onboarding_completed !== undefined ? updated.onboarding_completed : profile?.onboarding_completed,
      };

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        if (data.emergency_contacts) {
          setEmergencyContacts(data.emergency_contacts);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Profile update failed", err);
      return false;
    }
  };

  // Complete Onboarding
  const completeOnboarding = async (data: Partial<Profile>, contacts?: EmergencyContact[]): Promise<boolean> => {
    return await updateProfile({ ...data, onboarding_completed: true }, contacts);
  };

  // Danger Zone: Account Deletion
  const deleteAccount = async (reason?: string): Promise<{ success: boolean; error?: string }> => {
    const currentToken = token || localStorage.getItem("qr_health_token");
    try {
      // 1. Delete on backend
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ confirm: true, reason }),
      });

      // 2. Delete on Firebase Auth
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (fbErr: any) {
          console.warn("Firebase deleteUser notice:", fbErr.message);
        }
      }

      await logout();
      return { success: res.ok };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete account" };
    }
  };

  const refreshProfile = async () => {
    const currentToken = token || localStorage.getItem("qr_health_token");
    if (currentToken) {
      await syncWithBackend(currentToken);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out notice", err);
    }
    setToken(null);
    setFirebaseUser(null);
    setProfile(null);
    setEmergencyContacts([]);
    localStorage.removeItem("qr_health_token");
  };

  const hasCompletedOnboarding = profile ? profile.onboarding_completed !== false : true;

  const sendOtp = async (phone: string) => {
    return {
      status: "success",
      message: `OTP sent to ${phone}`,
      demo_hint: "Use fixed test OTP: 123456",
    };
  };

  const verifyOtp = async (phone: string, otpVal: string): Promise<boolean> => {
    if (otpVal.trim() === "123456" || otpVal.trim().length === 6) {
      const demoToken = "demo_jwt_token_123456";
      setToken(demoToken);
      localStorage.setItem("qr_health_token", demoToken);
      await syncWithBackend(demoToken, { phone });
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        firebaseUser,
        profile,
        emergencyContacts,
        isAuthenticated: !!token && !!profile,
        isLoading,
        isFirebaseReady,
        hasCompletedOnboarding,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        loginAsDemo,
        linkGoogleAccount,
        linkPhoneNumber,
        confirmPhoneLink,
        updateProfile,
        completeOnboarding,
        deleteAccount,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
