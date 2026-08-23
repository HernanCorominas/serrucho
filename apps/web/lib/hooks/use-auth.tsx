"use client";

import * as React from "react";
import { Profile } from "@/lib/types/domain";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, name?: string) => Promise<void>;
  signUp: (email: string, name: string, phone?: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<Profile>;
  linkDeviceSessions: () => Promise<{ linkedParticipants: number; linkedSerruchos: number }>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "serrucho_auth_user_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load user from storage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setProfile(parsed.profile);
      }
    } catch (e) {
      console.warn("Error reading auth state from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAuthState = (newUser: AuthUser | null, newProfile: Profile | null) => {
    setUser(newUser);
    setProfile(newProfile);
    if (newUser) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: newUser, profile: newProfile })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const linkDeviceSessions = async () => {
    if (!user) return { linkedParticipants: 0, linkedSerruchos: 0 };

    try {
      const itemsToLink: Array<{
        serruchoId: string;
        participantId?: string | null;
        isCreator?: boolean;
      }> = [];

      // 1. Scan recent serruchos
      const recentsJson = localStorage.getItem("serrucho_recent_items_v1");
      if (recentsJson) {
        const recents: Array<{ id: string }> = JSON.parse(recentsJson);
        for (const r of recents) {
          const myId = localStorage.getItem(`serrucho_my_id_${r.id}`);
          itemsToLink.push({
            serruchoId: r.id,
            participantId: myId || undefined,
            isCreator: true,
          });
        }
      }

      if (itemsToLink.length === 0) return { linkedParticipants: 0, linkedSerruchos: 0 };

      const res = await fetch("/api/user/link-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, items: itemsToLink }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          linkedParticipants: data.linkedParticipants || 0,
          linkedSerruchos: data.linkedSerruchos || 0,
        };
      }
    } catch (e) {
      console.warn("Could not link device sessions", e);
    }
    return { linkedParticipants: 0, linkedSerruchos: 0 };
  };

  const signIn = async (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    // Deterministic or clean user ID
    const userId = `usr-${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;
    const cleanName = name || cleanEmail.split("@")[0];

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
      }),
    });

    const data = await res.json();
    const activeProfile: Profile = data.profile || {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      created_at: new Date().toISOString(),
    };

    const authUser: AuthUser = {
      id: userId,
      email: cleanEmail,
      name: activeProfile.full_name || cleanName,
    };

    saveAuthState(authUser, activeProfile);

    // Auto-link device sessions asynchronously
    linkDeviceSessions().catch(() => {});
  };

  const signUp = async (email: string, name: string, phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const userId = `usr-${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        email: cleanEmail,
        full_name: name.trim(),
        phone: phone?.trim() || null,
      }),
    });

    const data = await res.json();
    const activeProfile: Profile = data.profile || {
      id: userId,
      email: cleanEmail,
      full_name: name.trim(),
      phone: phone?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const authUser: AuthUser = {
      id: userId,
      email: cleanEmail,
      name: activeProfile.full_name || name.trim(),
    };

    saveAuthState(authUser, activeProfile);

    // Auto-link device sessions asynchronously
    linkDeviceSessions().catch(() => {});
  };

  const signOut = () => {
    saveAuthState(null, null);
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
    if (!user) throw new Error("No hay usuario autenticado");

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        ...data,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al actualizar perfil");
    }

    const resData = await res.json();
    const updatedProfile: Profile = resData.profile;

    const updatedUser: AuthUser = {
      ...user,
      name: updatedProfile.full_name || user.name,
    };

    saveAuthState(updatedUser, updatedProfile);
    return updatedProfile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        linkDeviceSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
