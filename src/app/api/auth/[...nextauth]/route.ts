import type { NextRequest } from "next/server";
import { handlers } from "~/server/auth";
import { isAuthJsPasskeyRegistrationRequest } from "~/server/auth/passkey/registrationGuard";

export const { POST } = handlers;

export function GET(request: NextRequest) {
  if (isAuthJsPasskeyRegistrationRequest(request)) {
    return Response.json(
      { error: "Passkey registration is only available on the profile page" },
      { status: 403 },
    );
  }
  return handlers.GET(request);
}
