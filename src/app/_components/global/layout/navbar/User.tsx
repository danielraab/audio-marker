"use client";

import { NavbarContent, NavbarItem } from "@heroui/navbar";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { User, LogIn, LogOut, Settings } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("Navbar.UserMenu");

  return (
    <NavbarContent as="div" justify="end" className="grow-0">
      <NavbarItem>
        {status === "loading" ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-default-200" />
        ) : session?.user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                src={session.user.image ?? undefined}
                name={session.user.name ?? session.user.email ?? "User"}
                size="sm"
                className="transition-transform hover:scale-105"
                radius="full"
                fallback={<User className="h-4 w-4" />}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label={t("userMenuAriaLabel")} variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{t("signedInAs")}</p>
                <p className="font-semibold">{session.user.email}</p>
              </DropdownItem>
              {session.user.isAdmin ? (
                <DropdownItem
                  key="settings"
                  startContent={<Settings className="h-4 w-4" />}
                  onPress={() => router.push("/settings")}
                >
                  {t("settings")}
                </DropdownItem>
              ) : null}
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut className="h-4 w-4" />}
                onPress={() => signOut()}
              >
                {t("signOut")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                size="sm"
                className="transition-transform hover:scale-105"
                radius="full"
                fallback={<User className="h-4 w-4" />}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label={t("authMenuAriaLabel")}>
              <DropdownItem
                key="signin"
                startContent={<LogIn className="h-4 w-4" />}
                onPress={() => signIn()}
              >
                {t("signIn")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarItem>
    </NavbarContent>
  );
}
