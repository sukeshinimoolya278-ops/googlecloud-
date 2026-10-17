"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export interface PatientProfile {
  age?: number;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  emergency_enabled: boolean;
}

export interface User {
  id: number;
  role: "patient" | "doctor";
  full_name: string;
  email?: string;
  phone?: string;
  auth_provider: string;
  preferred_language: "en" | "hi" | "kn";
  doctor_reg_no?: string;
  profile?: PatientProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  loginDemo: (role?: "patient" | "doctor") => Promise<void>;
  loginPhoneOtp: (phone: string, otp: string) => Promise<void>;
  updateRole: (role: "patient" | "doctor", regNo?: string, fullName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  error: null,
  loginDemo: async () => {},
  loginPhoneOtp: async () => {},
  updateRole: async () => {},
  logout: () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("vault_token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (jwt: string) => {
    try {
      setIsLoading(true);
      const userData = await apiRequest<User>("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setUser(userData);
      setError(null);
    } catch (err: any) {
      console.warn("Session expired or invalid:", err.message);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (accessToken: string, authUser: User) => {
    setToken(accessToken);
    setUser(authUser);
    localStorage.setItem("vault_token", accessToken);
    setError(null);
  };

  const loginDemo = async (role: "patient" | "doctor" = "patient") => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiRequest<{ access_token: string; user: User }>("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({
          auth_type: "demo",
          demo_role: role,
        }),
      });
      handleAuthSuccess(res.access_token, res.user);
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginPhoneOtp = async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiRequest<{ access_token: string; user: User }>("/api/auth/session", {
        method: "POST",
        body: JSON.stringify({
          auth_type: "phone_otp",
          phone,
          otp,
        }),
      });
      handleAuthSuccess(res.access_token, res.user);
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (role: "patient" | "doctor", regNo?: string, fullName?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiRequest<{ access_token: string; user: User }>("/api/auth/role", {
        method: "POST",
        body: JSON.stringify({
          role,
          doctor_reg_no: regNo,
          full_name: fullName,
        }),
      });
      handleAuthSuccess(res.access_token, res.user);
    } catch (err: any) {
      setError(err.message || "Failed to update role");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("vault_token");
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        loginDemo,
        loginPhoneOtp,
        updateRole,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
