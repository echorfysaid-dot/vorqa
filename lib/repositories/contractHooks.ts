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
  const { query, status, category, supplier, projectId, organizationId } = filters;

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    contractRepository.getContracts({ query, status, category, supplier, projectId, organizationId }).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [query, status, category, supplier, projectId, organizationId]);

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
