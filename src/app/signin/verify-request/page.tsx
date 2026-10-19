import { Card, CardBody } from "@heroui/card";
import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("VerifyRequestPage");
  return { title: t("title") };
}

export default async function VerifyRequest() {
  const t = await getTranslations("VerifyRequestPage");

  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardBody className="items-center gap-3 p-8 text-center">
          <MailCheck className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-default-500">{t("description")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
