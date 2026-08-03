"use client";

import { useEffect, useState } from "react";
import type { Department } from "@/lib/models";
import { departmentRepository } from "./departmentRepository";

type DepartmentsState = {
  data: Department[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useDepartmentsRepository(organizationId: string): DepartmentsState {
  const [state, setState] = useState<DepartmentsState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    departmentRepository.getDepartments(organizationId).then((result) => {
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
