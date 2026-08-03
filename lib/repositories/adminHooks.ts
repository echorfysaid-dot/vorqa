"use client";

import { useEffect, useState } from "react";
import type { AdminDashboard, AdminUser, AuditSummary, FeatureFlag, OrganizationSummary, PlatformSetting, SubscriptionSummary, SystemHealth } from "@/lib/models";
import { adminRepository, type AdminRepositoryResult } from "./adminRepository";

type AdminState<T> = AdminRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): AdminState<T> {
  return { data, source: "demo", isFallback: false, loading: true };
}

function useAdminData<T>(initialData: T, loader: () => Promise<AdminRepositoryResult<T>>, deps: React.DependencyList = []) {
  const [state, setState] = useState<AdminState<T>>(() => initialState(initialData));
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    loader().then((result) => {
      if (active) setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, deps);
  return state;
}

export function useAdminDashboard() {
  return useAdminData<AdminDashboard>(adminRepository.getDashboardSync(), () => adminRepository.getDashboard(), []);
}

export function useAdminUsers(query = "") {
  return useAdminData<AdminUser[]>(adminRepository.getDashboardSync().users, () => adminRepository.getUsers(query), [query]);
}

export function useAdminOrganizations(query = "") {
  return useAdminData<OrganizationSummary[]>(adminRepository.getDashboardSync().organizations, () => adminRepository.getOrganizations(query), [query]);
}

export function useAdminSubscriptions() {
  return useAdminData<SubscriptionSummary[]>(adminRepository.getDashboardSync().subscriptions, () => adminRepository.getSubscriptions(), []);
}

export function useAdminAudit(query = "", type = "all") {
  return useAdminData<AuditSummary[]>(adminRepository.getDashboardSync().audit, () => adminRepository.getAudit(query, type), [query, type]);
}

export function useAdminFeatureFlags() {
  return useAdminData<FeatureFlag[]>(adminRepository.getDashboardSync().featureFlags, () => adminRepository.getFeatureFlags(), []);
}

export function useAdminSystemHealth() {
  return useAdminData<SystemHealth>(adminRepository.getDashboardSync().health, () => adminRepository.getSystemHealth(), []);
}

export function useAdminSettings() {
  return useAdminData<PlatformSetting[]>(adminRepository.getDashboardSync().settings, () => adminRepository.getSettings(), []);
}
