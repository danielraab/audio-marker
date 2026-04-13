"use client";

import { Navbar as HeroNavbar, NavbarBrand } from "@heroui/navbar";
import UserMenu from "./User";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface NavbarProps {
  title?: string;
  logoSrc?: string;
}

export default function Navbar({
  title = "Audio Marker",
  logoSrc,
}: NavbarProps) {
  const t = useTranslations("Navbar");

  return (
    <HeroNavbar isBordered>
      {/* Left side - Logo */}
      <NavbarBrand className="grow-0">
        <Link href="/" className="flex items-center gap-2">
          {logoSrc ? (
            <Image
              height={32}
              width={32}
              src={logoSrc}
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
          ) : (
            <Image
              height={32}
              width={32}
              src="/audio-marker-logo.svg"
              alt={t("applicationLogo")}
              className="h-8 w-8 object-contain transition-transform hover:scale-105"
            />
          )}
          <span className="font-bold text-inherit">{title}</span>
        </Link>
      </NavbarBrand>

      <UserMenu />
    </HeroNavbar>
  );
}
