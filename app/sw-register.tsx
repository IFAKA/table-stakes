"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type PwaStatus = "unsupported" | "checking" | "current" | "update-available" | "updating" | "error";
export type InstallStatus = "unavailable" | "available" | "installed" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaContextValue = {
  status: PwaStatus;
  installStatus: InstallStatus;
  isOnline: boolean;
  checkForUpdates: () => Promise<void>;
  updateNow: () => void;
  install: () => Promise<void>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside ServiceWorkerRegistration");
  return context;
}

export function ServiceWorkerRegistration({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PwaStatus>("checking");
  const [installStatus, setInstallStatus] = useState<InstallStatus>("unavailable");
  const [isOnline, setIsOnline] = useState(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const reloadAfterControllerChangeRef = useRef(false);

  const checkForUpdates = useCallback(async () => {
    if (!isOnline || !navigator.onLine || !registrationRef.current) return;
    setStatus((current) => current === "update-available" ? current : "checking");
    try {
      await registrationRef.current.update();
      const registration = registrationRef.current;
      if (registration.waiting) setStatus("update-available");
      else if (!registration.installing) setStatus("current");
    } catch {
      setStatus("error");
    }
  }, [isOnline]);

  const updateNow = useCallback(() => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return;
    reloadAfterControllerChangeRef.current = true;
    setStatus("updating");
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, []);

  const install = useCallback(async () => {
    const promptEvent = installPromptRef.current;
    if (!promptEvent) return;
    installPromptRef.current = null;
    setInstallStatus("unavailable");
    await promptEvent.prompt();
    setInstallStatus((await promptEvent.userChoice).outcome === "accepted" ? "installed" : "dismissed");
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as BeforeInstallPromptEvent;
      setInstallStatus("available");
    };
    const handleInstalled = () => {
      installPromptRef.current = null;
      setInstallStatus("installed");
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void checkForUpdates();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    document.addEventListener("visibilitychange", handleVisibility);

    if (!("serviceWorker" in navigator)) setStatus("unsupported");
    else {
      const serviceWorkerUrl = process.env.NODE_ENV === "development" ? "/sw-dev.js" : "/sw.js";
      void navigator.serviceWorker.register(serviceWorkerUrl, { updateViaCache: "none" }).then((registration) => {
        registrationRef.current = registration;
        const inspect = () => {
          if (registration.waiting) setStatus("update-available");
          else if (registration.installing) setStatus("checking");
          else if (registration.active) setStatus("current");
        };
        const handleUpdateFound = () => {
          setStatus("checking");
          registration.installing?.addEventListener("statechange", inspect);
        };
        const handleControllerChange = () => {
          if (!reloadAfterControllerChangeRef.current) return;
          reloadAfterControllerChangeRef.current = false;
          window.location.reload();
        };
        registration.addEventListener("updatefound", handleUpdateFound);
        registration.installing?.addEventListener("statechange", inspect);
        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
        inspect();
        void checkForUpdates();
      }).catch(() => setStatus("error"));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkForUpdates]);

  useEffect(() => {
    const onForeground = () => { if (document.visibilityState === "visible") void checkForUpdates(); };
    window.addEventListener("focus", onForeground);
    return () => window.removeEventListener("focus", onForeground);
  }, [checkForUpdates]);

  const value = useMemo(() => ({ status, installStatus, isOnline, checkForUpdates, updateNow, install }), [status, installStatus, isOnline, checkForUpdates, updateNow, install]);
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
