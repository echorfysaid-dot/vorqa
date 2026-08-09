"use client";

import { useEffect, useState } from "react";
import type { Notification, NotificationFilters, NotificationPreference, NotificationSummary } from "@/lib/models";
import { notificationRepository, type NotificationRepositoryResult } from "./notificationRepository";

type NotificationState<T> = NotificationRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): NotificationState<T> {
  return {
    data,
    source: "demo",
    isFallback: false,
    loading: true
  };
}

export function useNotifications(filters: NotificationFilters = {}) {
  const [state, setState] = useState<NotificationState<Notification[]>>(() => initialState(notificationRepository.list()));
  const { query, status, priority, type, module, page, pageSize } = filters;

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    notificationRepository.getNotifications({ query, status, priority, type, module, page, pageSize }).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [query, status, priority, type, module, page, pageSize]);

  return state;
}

export function useNotificationSummary() {
  const [state, setState] = useState<NotificationState<NotificationSummary>>(() => initialState(notificationRepository.getSummarySync()));

  useEffect(() => {
    let active = true;
    notificationRepository.getSummary().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function useNotificationPreferences() {
  const [state, setState] = useState<NotificationState<NotificationPreference | undefined>>(() => initialState(undefined));

  useEffect(() => {
    let active = true;
    notificationRepository.getPreferences().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
