"use client";

import { useEffect, useState } from "react";
import type { MarketplaceCompany, MarketplaceConnection, MarketplaceDashboardWidgets, MarketplaceFavorite, MarketplaceFilters, MarketplaceMessage } from "@/lib/models";
import { marketplaceRepository, type MarketplaceRepositoryResult } from "./marketplaceRepository";

type MarketplaceState<T> = MarketplaceRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): MarketplaceState<T> {
  return {
    data,
    source: "demo",
    isFallback: false,
    loading: true
  };
}

export function useMarketplaceCompanies(filters: MarketplaceFilters = {}) {
  const [state, setState] = useState<MarketplaceState<MarketplaceCompany[]>>(() => initialState(marketplaceRepository.listCompanies()));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    marketplaceRepository.getCompanies(filters).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [
    filters.query,
    filters.country,
    filters.city,
    filters.category,
    filters.experience,
    filters.rating,
    filters.verified,
    filters.availability,
    filters.sort,
    filters.languages?.join("|"),
    filters.services?.join("|")
  ]);

  return state;
}

export function useMarketplaceDashboard() {
  const [state, setState] = useState<MarketplaceState<MarketplaceDashboardWidgets>>(() => initialState({
    recentlyAdded: marketplaceRepository.listFeatured(4),
    topRated: marketplaceRepository.listFeatured(4),
    verifiedCompanies: marketplaceRepository.listFeatured(4).filter((company) => company.verified),
    nearbyCompanies: marketplaceRepository.listFeatured(4),
    recommendedPartners: marketplaceRepository.listFeatured(4)
  }));

  useEffect(() => {
    let active = true;
    marketplaceRepository.getDashboardWidgets().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useMarketplaceConnections() {
  const [state, setState] = useState<MarketplaceState<MarketplaceConnection[]>>(() => initialState([]));

  useEffect(() => {
    let active = true;
    marketplaceRepository.getConnections().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useMarketplaceMessages(connectionId?: string) {
  const [state, setState] = useState<MarketplaceState<MarketplaceMessage[]>>(() => initialState([]));

  useEffect(() => {
    if (!connectionId) {
      setState({ data: [], source: "demo", isFallback: false, loading: false });
      return;
    }
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    marketplaceRepository.getMessages(connectionId).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [connectionId]);

  return state;
}

export function useMarketplaceFavorites() {
  const [state, setState] = useState<MarketplaceState<MarketplaceFavorite[]>>(() => initialState([]));

  useEffect(() => {
    let active = true;
    marketplaceRepository.getFavorites().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
