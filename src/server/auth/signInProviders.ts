import type { Provider, ProviderType } from "next-auth/providers";

export interface SignInProvider {
  id: string;
  name: string;
  type: ProviderType;
}

/** Reduces the configured Auth.js providers to what the sign-in page renders. */
export function toSignInProviders(providers: Provider[]): SignInProvider[] {
  return providers.map((provider) => {
    const { id, name, type } =
      typeof provider === "function" ? provider() : provider;
    return { id, name, type };
  });
}
