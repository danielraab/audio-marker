import { describe, expect, it } from "vitest";
import { getSignInErrorKey } from "./signInError";

describe("getSignInErrorKey", () => {
  it("maps known Auth.js error codes", () => {
    expect(getSignInErrorKey("AccessDenied")).toBe("accessDenied");
    expect(getSignInErrorKey("Verification")).toBe("verification");
    expect(getSignInErrorKey("OAuthAccountNotLinked")).toBe("accountNotLinked");
    expect(getSignInErrorKey("WebAuthnVerificationError")).toBe("passkey");
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(getSignInErrorKey("Configuration")).toBe("default");
    expect(getSignInErrorKey("constructor")).toBe("default");
  });
});
