"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));
      return;
    }
    if (process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    }
  }, []);
  return null;
}
