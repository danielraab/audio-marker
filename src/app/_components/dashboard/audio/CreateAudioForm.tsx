"use client";

import type React from "react";
import { useState } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Progress,
  Textarea,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { Music4, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CreateAudioForm() {
  const t = useTranslations("CreateAudioForm");
  const [audioName, setAudioName] = useState("");
  const [description, setDescription] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"" | "uploading" | "success" | "error">(
    "",
  );
  const [message, setMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type on the frontend
      if (
        !selectedFile.type.includes("audio/mpeg") &&
        !selectedFile.type.includes("audio/mp3")
      ) {
        setMessage(t("fileInvalidType"));
        setFile(null);
        return;
      }

      // Validate file extension
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileExtension !== "mp3") {
        setMessage(t("fileInvalidExtension"));
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setStatus(""); // Clear any previous error messages
    }
  };

  const uploadFileWithProgress = (
    file: File,
    name: string,
    description: string,
  ): Promise<{ id: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          setUploadProgress(percentComplete);
        }
      };

      // Handle completion
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText) as {
            success: boolean;
            id: string;
          };
          resolve(response);
        } else {
          const error = JSON.parse(xhr.responseText) as { error: string };
          reject(new Error(error.error || "Upload failed"));
        }
      };

      // Handle errors
      xhr.onerror = () => {
        reject(new Error("Network error occurred"));
      };

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      if (description) {
        formData.append("description", description);
      }

      // Send request
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !audioName) {
      setStatus("error");
      setMessage(t("uploadInputError"));
      return;
    }

    setStatus("uploading");
    setMessage(t("uploading"));
    setUploadProgress(0);
    setIsUploading(true);

    try {
      await uploadFileWithProgress(file, audioName, description);

      setStatus("success");
      setMessage(t("uploadSuccess"));
      router.refresh(); // Refresh to show the new audio file in the list
      setAudioName("");
      setDescription("");
      setFile(null);

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t("uploadError"));
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => setIsExpanded(true)}
        >
          {t("title")} <Music4 />
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md font-semibold">{t("title")}</p>
          <p className="text-small text-default-500">{t("subtitle")}</p>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            label={t("namePlaceholder")}
            placeholder={t("namePlaceholder")}
            value={audioName}
            onValueChange={setAudioName}
            isRequired
            variant="bordered"
            labelPlacement="outside"
            autoFocus
          />

          <Textarea
            label={t("descriptionLabel")}
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onValueChange={setDescription}
            variant="bordered"
            labelPlacement="outside"
            maxLength={500}
            minRows={3}
          />

          <Input
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            onChange={handleFileChange}
            label={t("fileLabel")}
            labelPlacement="outside"
            variant="bordered"
            isRequired
            description={
              file
                ? t("selectedFile", { fileName: file.name })
                : t("selectFile")
            }
            classNames={{
              input:
                "file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer",
              inputWrapper: "hover:border-primary-300",
            }}
          />

          <div className="flex justify-between gap-2">
            <Button
              onPress={() => setIsExpanded(false)}
              type="button"
              variant="light"
              isDisabled={isUploading}
              startContent={
                isUploading ? <Spinner size="sm" color="white" /> : null
              }
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              isDisabled={isUploading}
              startContent={
                isUploading ? <Spinner size="sm" color="white" /> : null
              }
            >
              {isUploading ? t("uploading") : t("uploadButton")}
            </Button>
          </div>

          {status === "uploading" && uploadProgress > 0 && (
            <Progress
              value={uploadProgress}
              color="primary"
              size="sm"
              label={t("uploading")}
              showValueLabel={true}
              className="w-full"
              classNames={{
                base: "w-full",
                track: "h-2",
                indicator: "h-2",
              }}
            />
          )}

          {status && status !== "uploading" && (
            <Chip
              color={
                status === "success"
                  ? "success"
                  : status === "error"
                    ? "danger"
                    : "default"
              }
              variant="flat"
              className="w-full justify-center"
            >
              {message}
            </Chip>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
