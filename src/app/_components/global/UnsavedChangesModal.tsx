"use client";

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { useTranslations } from "next-intl";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  const t = useTranslations("UnsavedChangesModal");
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{t("title")}</ModalHeader>
        <ModalBody>{t("body")}</ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onDiscard}>
            {t("discard")}
          </Button>
          <Button color="primary" onPress={onSave}>
            {t("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
