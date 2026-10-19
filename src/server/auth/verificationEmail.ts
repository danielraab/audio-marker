import type { NodemailerConfig } from "next-auth/providers/nodemailer";
import { getTranslations } from "next-intl/server";
import { createTransport } from "nodemailer";

type VerificationRequestParams = Parameters<
  NodemailerConfig["sendVerificationRequest"]
>[0];

export interface VerificationEmailTexts {
  subject: string;
  heading: (host: string) => string;
  button: string;
  ignoreNotice: string;
}

interface VerificationEmailContent {
  url: string;
  host: string;
  brandColor?: string;
  buttonTextColor?: string;
}

/** Based on the default Auth.js email layout, with translated texts. */
export function renderVerificationEmail(
  { url, host, brandColor, buttonTextColor }: VerificationEmailContent,
  texts: VerificationEmailTexts,
) {
  // Invisible space prevents mail clients from turning the host into a link
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    button: brandColor ?? "#346df1",
    buttonText: buttonTextColor ?? "#fff",
  };

  return {
    subject: texts.subject,
    text: `${texts.heading(host)}\n${url}\n\n${texts.ignoreNotice}\n`,
    html: `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        ${texts.heading(`<strong>${escapedHost}</strong>`)}
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.button}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.button}; display: inline-block; font-weight: bold;">${texts.button}</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        ${texts.ignoreNotice}
      </td>
    </tr>
  </table>
</body>
`,
  };
}

export async function sendVerificationRequest({
  identifier,
  url,
  provider,
  theme,
}: VerificationRequestParams) {
  const t = await getTranslations("VerificationEmail");
  const host = new URL(url).host;
  const email = renderVerificationEmail(
    {
      url,
      host,
      brandColor: theme.brandColor,
      buttonTextColor: theme.buttonText,
    },
    {
      subject: t("subject", { host }),
      heading: (hostValue) => t("heading", { host: hostValue }),
      button: t("button"),
      ignoreNotice: t("ignoreNotice"),
    },
  );

  const transport = createTransport(provider.server);
  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    ...email,
  });
  const failed = [...result.rejected, ...(result.pending ?? [])].filter(
    Boolean,
  );
  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`);
  }
}
