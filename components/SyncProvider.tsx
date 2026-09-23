"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { pendingCount, subscribeData, syncAll } from "@/lib/repository";

type SyncValue = {
  pending: number;
  online: boolean;
  syncing: boolean;
  ready: boolean;
};

const SyncContext = createContext<SyncValue>({
  pending: 0,
  online: true,
  syncing: false,
  ready: false,
});

export function useSync() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshPending = useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  const run = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await refreshPending();
      setReady(true);
      return;
    }
    setSyncing(true);
    try {
      await syncAll();
    } finally {
      await refreshPending();
      setSyncing(false);
      setReady(true);
    }
  }, [refreshPending]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => {
      setOnline(true);
      void run();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const unsubscribe = subscribeData(() => {
      void refreshPending();
    });
    void run();
    const timer = window.setInterval(() => void run(), 20000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [refreshPending, run]);

  return (
    <SyncContext.Provider value={{ pending, online, syncing, ready }}>
      {children}
      <SyncBar pending={pending} online={online} syncing={syncing} />
    </SyncContext.Provider>
  );
}

function SyncBar({ pending, online, syncing }: { pending: number; online: boolean; syncing: boolean }) {
  if (online && pending === 0 && !syncing) return null;
  let text = "Sem internet";
  if (syncing) text = "Sincronizando…";
  else if (pending > 0) text = `Aguardando sincronização (${pending})`;
  else if (!online) text = "Sem internet";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-eleva px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-cream">
      {text}
    </div>
  );
}
