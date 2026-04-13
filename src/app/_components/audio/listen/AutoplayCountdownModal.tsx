"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
} from "@heroui/react";
import { PlayCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface AutoplayCountdownModalProps {
  isOpen: boolean;
  nextAudioName: string;
  onCancel: () => void;
  onPlayNext: () => void;
  countdownSeconds?: number;
}

export function AutoplayCountdownModal({
  isOpen,
  nextAudioName,
  onCancel,
  onPlayNext,
  countdownSeconds = 5,
}: AutoplayCountdownModalProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const t = useTranslations("AutoplayCountdownModal");

  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownSeconds);
      return;
    }

    if (countdown <= 0) {
      onPlayNext();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, countdown, countdownSeconds, onPlayNext]);

  const progress = ((countdownSeconds - countdown) / countdownSeconds) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      isDismissable={true}
      hideCloseButton={false}
      size="md"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{t("title")}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-center text-lg">
              {t("message", { audioName: nextAudioName })}
            </p>

            <div className="text-center">
              <span className="text-5xl font-bold text-primary">
                {countdown}
              </span>
              <p className="text-sm text-default-500 mt-1">{t("seconds")}</p>
            </div>

            <Progress
              value={progress}
              color="primary"
              className="w-full"
              aria-label={t("progressLabel")}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onCancel}
            startContent={<X size={16} />}
          >
            {t("cancel")}
          </Button>
          <Button
            color="primary"
            onPress={onPlayNext}
            startContent={<PlayCircle size={16} />}
          >
            {t("playNow")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
