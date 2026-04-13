"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { api } from "~/trpc/react";
import { Shield, Ban } from "lucide-react";
import { useTranslations } from "next-intl";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  isDisabled: boolean;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

export default function UserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserModalProps) {
  const t = useTranslations("UserModal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    general?: string;
  }>({});

  const utils = api.useUtils();
  const isEditMode = !!user;

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setIsAdmin(user.isAdmin);
        setIsDisabled(user.isDisabled);
      } else {
        setName("");
        setEmail("");
        setIsAdmin(false);
        setIsDisabled(false);
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const createUserMutation = api.admin.userManagement.createUser.useMutation({
    onSuccess: () => {
      void utils.admin.userManagement.getAllUsers.invalidate();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const updateUserMutation = api.admin.userManagement.updateUser.useMutation({
    onSuccess: () => {
      void utils.admin.userManagement.getAllUsers.invalidate();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) {
      newErrors.name = t("errors.nameRequired");
    }
    if (!email.trim()) {
      newErrors.email = t("errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("errors.emailInvalid");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditMode && user) {
      updateUserMutation.mutate({
        id: user.id,
        name,
        email,
        isAdmin,
        isDisabled,
      });
    } else {
      createUserMutation.mutate({
        name,
        email,
        isAdmin,
        isDisabled,
      });
    }
  };

  const isLoading =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {isEditMode ? t("title.edit") : t("title.add")}
          </ModalHeader>
          <ModalBody>
            {errors.general && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {errors.general}
              </div>
            )}

            <Input
              label={t("fields.name.label")}
              placeholder={t("fields.name.placeholder")}
              value={name}
              onValueChange={setName}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              isRequired
              autoFocus
            />

            <Input
              label={t("fields.email.label")}
              placeholder={t("fields.email.placeholder")}
              type="email"
              value={email}
              onValueChange={setEmail}
              isInvalid={!!errors.email}
              errorMessage={errors.email}
              isRequired
            />

            <Switch
              isSelected={isAdmin}
              onValueChange={setIsAdmin}
              classNames={{
                base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-warning",
              }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-medium">{t("fields.isAdmin.label")}</p>
                <p className="text-tiny text-default-400">
                  {t("fields.isAdmin.description")}
                </p>
              </div>
              {isAdmin && <Shield className="h-4 w-4 text-warning" />}
            </Switch>

            <Switch
              isSelected={isDisabled}
              onValueChange={setIsDisabled}
              classNames={{
                base: "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent data-[selected=true]:border-danger",
              }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-medium">{t("fields.isDisabled.label")}</p>
                <p className="text-tiny text-default-400">
                  {t("fields.isDisabled.description")}
                </p>
              </div>
              {isDisabled && <Ban className="h-4 w-4 text-danger" />}
            </Switch>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
              isDisabled={isLoading}
            >
              {t("actions.cancel")}
            </Button>
            <Button color="primary" type="submit" isLoading={isLoading}>
              {isEditMode ? t("actions.update") : t("actions.create")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
