"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createAiMemory, type MemorySnapshot, type NavigationMemoryEntry } from "@/lib/ai-memory";
import { useAiApplicationContext } from "@/components/ai-context-provider";

const AiMemoryContext = createContext<MemorySnapshot | null>(null);

function createSessionSeed() {
  const timestamp = new Date().toISOString();
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `memory-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    sessionId: random,
    startedAt: timestamp
  };
}

export function AiMemoryProvider({ children }: { children: React.ReactNode }) {
  const applicationContext = useAiApplicationContext();
  const sessionRef = useRef(createSessionSeed());
  const [recentNavigation, setRecentNavigation] = useState<readonly NavigationMemoryEntry[]>([]);

  useEffect(() => {
    const entry: NavigationMemoryEntry = {
      pathname: applicationContext.route.pathname,
      workspaceType: applicationContext.workspace.type,
      entityType: applicationContext.entity.type,
      visitedAt: new Date().toISOString()
    };

    setRecentNavigation((current) => {
      const previous = current[0];
      if (previous?.pathname === entry.pathname && previous.entityType === entry.entityType) return current;
      return Object.freeze([entry, ...current].slice(0, 12));
    });
  }, [applicationContext.route.pathname, applicationContext.workspace.type, applicationContext.entity.type]);

  const memory = useMemo(
    () =>
      createAiMemory({
        context: applicationContext,
        session: sessionRef.current,
        recentNavigation
      }),
    [applicationContext, recentNavigation]
  );

  return <AiMemoryContext.Provider value={memory}>{children}</AiMemoryContext.Provider>;
}

export function useAiMemory() {
  const memory = useContext(AiMemoryContext);
  if (!memory) {
    throw new Error("useAiMemory must be used inside AiMemoryProvider");
  }
  return memory;
}
