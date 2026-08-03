"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import type { AccountIdentity, OnboardingProfile, RoleWorkspaceConfiguration } from "@/types/onboarding";

export function useOnboardingProfile(enabled = true) {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!enabled) { setLoading(false); return null; }
    setLoading(true);
    const response = await authFetch("/api/onboarding");
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(data.error || "Unable to load onboarding profile."); return null; }
    setError(""); setProfile(data.profile || null); return data.profile as OnboardingProfile | null;
  }, [enabled]);
  useEffect(() => { void refresh(); }, [refresh]);
  const complete = useCallback(async (identity: AccountIdentity, values: RoleWorkspaceConfiguration["values"]) => {
    setLoading(true);
    const response = await authFetch("/api/onboarding", { method: "PATCH", body: JSON.stringify({ ...identity, values }) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(data.error || "Unable to complete onboarding."); return false; }
    setProfile(data.profile); setError(""); return true;
  }, []);
  return { profile, loading, error, refresh, complete };
}
