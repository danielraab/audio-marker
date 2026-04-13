"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <HeroUIProvider>
      <SessionProvider>{children}</SessionProvider>
    </HeroUIProvider>
  );
}
