"use client";

import { useEffect, useState } from "react";
import type { BillingSummary, Invoice, Plan, UsageRecord } from "@/lib/models";
import { billingRepository, type BillingRepositoryResult } from "./billingRepository";

type BillingState<T> = BillingRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): BillingState<T> {
  return { data, source: "demo", isFallback: false, loading: true };
}

export function useBillingSummary() {
  const [state, setState] = useState<BillingState<BillingSummary>>(() => initialState(billingRepository.getSummarySync()));

  useEffect(() => {
    let active = true;
    billingRepository.getSummary().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useBillingPlans() {
  const [state, setState] = useState<BillingState<Plan[]>>(() => initialState(billingRepository.listPlans()));

  useEffect(() => {
    let active = true;
    billingRepository.getPlans().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useBillingUsage() {
  const [state, setState] = useState<BillingState<UsageRecord[]>>(() => initialState(billingRepository.getSummarySync().usage));

  useEffect(() => {
    let active = true;
    billingRepository.getUsage().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useBillingInvoices() {
  const [state, setState] = useState<BillingState<Invoice[]>>(() => initialState(billingRepository.getSummarySync().invoices));

  useEffect(() => {
    let active = true;
    billingRepository.getInvoices().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
