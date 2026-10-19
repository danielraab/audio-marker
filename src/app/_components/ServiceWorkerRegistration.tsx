"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export default function ServiceWorkerRegistration() {
  const t = useTranslations("ServiceWorker");
  // Ref keeps the mount-only effect below free of a dependency on `t`
  const updateMessageRef = useRef(t("updateAvailable"));
  updateMessageRef.current = t("updateAvailable");

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Pass environment mode to service worker via URL parameter
      const isDev = process.env.NODE_ENV === "development";
      const swUrl = `/sw.js?env=${isDev ? "development" : "production"}`;

      // Register service worker
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log(
            "Service Worker registered successfully:",
            registration.scope,
          );

          // Check for updates periodically
          setInterval(() => {
            registration.update().catch(console.error);
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log("New service worker available");

                  // Optionally notify user about update
                  if (confirm(updateMessageRef.current)) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker controller changed");
      });
    }
  }, []);

  return null;
}
