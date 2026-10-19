import Nodemailer from "next-auth/providers/nodemailer";
import Passkey from "next-auth/providers/passkey";
import { describe, expect, it } from "vitest";
import { toSignInProviders } from "./signInProviders";

describe("toSignInProviders", () => {
  it("keeps only id, name and type of configured providers", () => {
    const providers = toSignInProviders([
      Nodemailer({ server: "smtp://localhost", from: "a@example.com" }),
      Passkey({}),
    ]);

    expect(providers).toEqual([
      { id: "nodemailer", name: "Nodemailer", type: "email" },
      { id: "passkey", name: "Passkey", type: "webauthn" },
    ]);
  });

  it("resolves providers given as factory functions", () => {
    expect(toSignInProviders([() => Passkey({ name: "Key" })])).toEqual([
      { id: "passkey", name: "Key", type: "webauthn" },
    ]);
  });
});
