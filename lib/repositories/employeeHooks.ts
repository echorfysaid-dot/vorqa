"use client";

import { useEffect, useState } from "react";
import type { Employee } from "@/lib/models";
import { employeeRepository } from "./employeeRepository";

type EmployeesState = {
  data: Employee[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useEmployeesRepository(organizationId: string): EmployeesState {
  const [state, setState] = useState<EmployeesState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    employeeRepository.getEmployees(organizationId).then((result) => {
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
