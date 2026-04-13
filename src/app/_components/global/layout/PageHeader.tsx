"use client";

import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  backHref: string;
  title: string;
}

export default function PageHeader({ backHref, title }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button isIconOnly variant="light" onPress={() => router.push(backHref)}>
        <ArrowLeft size={20} />
      </Button>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
