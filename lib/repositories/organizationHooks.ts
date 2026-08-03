"use client";

import { useEffect, useState } from "react";
import type { Organization } from "@/lib/models";
import { organizationRepository } from "./organizationRepository";
import { mapDemoOrganizationToDomain } from "./organizationMapper";
import { organizationMemberRepository } from "./organizationMemberRepository";
import { organizationRoleRepository } from "./organizationRoleRepository";
import type { OrganizationMember, OrganizationRoleRecord } from "@/lib/models";

type OrganizationsState = {
  data: Organization[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

type OrganizationState = {
  data: Organization | undefined;
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

type OrganizationMembersState = {
  data: OrganizationMember[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

type OrganizationRolesState = {
  data: OrganizationRoleRecord[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useOrganizationsRepository(): OrganizationsState {
  const [state, setState] = useState<OrganizationsState>({
    data: organizationRepository.list().map(mapDemoOrganizationToDomain),
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    organizationRepository.getOrganizations().then((result) => {
      if (!active) return;
      setState({
        data: result.data,
        source: result.source,
        isFallback: result.isFallback,
        error: "error" in result ? result.error : undefined,
        loading: false
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useOrganizationRepository(id: string): OrganizationState {
  const [state, setState] = useState<OrganizationState>({
    data: organizationRepository.list().map(mapDemoOrganizationToDomain).find((organization) => organization.id === id || organization.slug === id),
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    organizationRepository.getOrganization(id).then((result) => {
      if (!active) return;
      setState({
        data: result.data,
        source: result.source,
        isFallback: result.isFallback,
        error: "error" in result ? result.error : undefined,
        loading: false
      });
    });
    return () => {
      active = false;
    };
  }, [id]);

  return state;
}

export function useOrganizationMembersRepository(organizationId: string): OrganizationMembersState {
  const [state, setState] = useState<OrganizationMembersState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    organizationMemberRepository.getOrganizationMembers(organizationId).then((result) => {
      if (!active) return;
      setState({
        data: result.data,
        source: result.source,
        isFallback: result.isFallback,
        error: "error" in result ? result.error : undefined,
        loading: false
      });
    });
    return () => {
      active = false;
    };
  }, [organizationId]);

  return state;
}

export function useOrganizationRolesRepository(organizationId: string): OrganizationRolesState {
  const [state, setState] = useState<OrganizationRolesState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    organizationRoleRepository.getOrganizationRoles(organizationId).then((result) => {
      if (!active) return;
      setState({
        data: result.data,
        source: result.source,
        isFallback: result.isFallback,
        error: "error" in result ? result.error : undefined,
        loading: false
      });
    });
    return () => {
      active = false;
    };
  }, [organizationId]);

  return state;
}
