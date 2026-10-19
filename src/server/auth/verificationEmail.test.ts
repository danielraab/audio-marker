import { describe, expect, it } from "vitest";
import { renderVerificationEmail } from "./verificationEmail";

const texts = {
  subject: "Bei example.com anmelden",
  heading: (host: string) => `Bei ${host} anmelden`,
  button: "Anmelden",
  ignoreNotice: "Falls du diese E-Mail nicht angefordert hast, ignoriere sie.",
};

describe("renderVerificationEmail", () => {
  const url = "https://example.com/api/auth/callback/nodemailer?token=abc";
  const email = renderVerificationEmail({ url, host: "example.com" }, texts);

  it("uses the translated subject", () => {
    expect(email.subject).toBe("Bei example.com anmelden");
  });

  it("renders translated texts and the sign-in link into the HTML body", () => {
    expect(email.html).toContain(`href="${url}"`);
    expect(email.html).toContain(">Anmelden</a>");
    expect(email.html).toContain(texts.ignoreNotice);
  });

  it("prevents mail clients from linking the host in the HTML heading", () => {
    expect(email.html).toContain(
      "Bei <strong>example&#8203;.com</strong> anmelden",
    );
  });

  it("renders a plain text fallback with the plain host", () => {
    expect(email.text).toBe(
      `Bei example.com anmelden\n${url}\n\n${texts.ignoreNotice}\n`,
    );
  });

  it("applies the theme colors", () => {
    const themed = renderVerificationEmail(
      {
        url,
        host: "example.com",
        brandColor: "#ff0000",
        buttonTextColor: "#000",
      },
      texts,
    );
    expect(themed.html).toContain('bgcolor="#ff0000"');
    expect(themed.html).toContain("color: #000;");
  });
});
