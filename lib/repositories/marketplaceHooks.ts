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
  const { query, country, city, category, experience, rating, verified, availability, sort, languages, services, page, pageSize } = filters;
  const languagesKey = JSON.stringify(languages ?? null);
  const servicesKey = JSON.stringify(services ?? null);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    marketplaceRepository.getCompanies({
      query,
      country,
      city,
      category,
      experience,
      rating,
      verified,
      availability,
      sort,
      languages: languagesKey === "null" ? undefined : JSON.parse(languagesKey) as string[],
      services: servicesKey === "null" ? undefined : JSON.parse(servicesKey) as string[],
      page,
      pageSize
    }).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [
    query,
    country,
    city,
    category,
    experience,
    rating,
    verified,
    availability,
    sort,
    languagesKey,
    servicesKey,
    page,
    pageSize
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
