"use client";

import { useEffect, useState } from "react";
import type { Contract, ContractFilters, ContractSummary } from "@/lib/models";
import { contractRepository, type ContractRepositoryResult } from "./contractRepository";

type ContractState<T> = ContractRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): ContractState<T> {
  return {
    data,
    source: "demo",
    isFallback: false,
    loading: true
  };
}

export function useContracts(filters: ContractFilters = {}) {
  const [state, setState] = useState<ContractState<Contract[]>>(() => initialState(contractRepository.list()));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    contractRepository.getContracts(filters).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [filters.query, filters.status, filters.category, filters.supplier, filters.projectId, filters.organizationId]);

  return state;
}

export function useContractSummary() {
  const [state, setState] = useState<ContractState<ContractSummary>>(() => initialState(contractRepository.getSummarySync()));

  useEffect(() => {
    let active = true;
    contractRepository.getSummary().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
