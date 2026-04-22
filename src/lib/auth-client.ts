import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { genericOAuthClient } from "better-auth/client/plugins";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "~/server/auth";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    genericOAuthClient(),
    customSessionClient<typeof auth>(),
  ],
});
