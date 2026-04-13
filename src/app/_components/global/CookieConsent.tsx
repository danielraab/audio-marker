"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a brief delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    setShowBanner(false);
    // In a production app, you would disable non-essential cookies here
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-start sm:items-center justify-between gap-2">
          <div className="flex flex-row justify-between w-full flex-1">
            <h3 className="font-semibold text-lg mb-1">🍪 We use cookies</h3>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={handleDecline}
              aria-label="Close banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We use only essential cookies for authentication and functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
