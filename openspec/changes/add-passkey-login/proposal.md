## Why

Users can currently sign in only via Authentik (OIDC) or an email magic link, both of which require a round-trip to another system (identity provider or mailbox). Passkeys (WebAuthn) offer a faster, phishing-resistant sign-in that works directly on the user's device, while the existing providers remain the trusted way to establish identity.

## What Changes

- Add passkey sign-in using the Auth.js Passkey (WebAuthn) provider; the default Auth.js sign-in page shows the generated "Sign in with Passkey" button.
- Passkeys are enabled by default and can be turned off via a new env flag `AUTH_PASSKEY_DISABLED`. Passkeys are also treated as disabled when `AUTH_URL` is not set (relying party cannot be derived reliably).
- Passkeys can only be **added** by an already signed-in user, and only within 5 minutes after a fresh sign-in with email or Authentik. A sign-in via passkey does not open this window. Auth.js's own "register" action (which could create new accounts and bypass `MAIL_REGISTRATION_ENABLED`) is blocked.
- New `/profile` page reachable for every signed-in user via a new "Profile" entry in the user menu. It is structured into sections so further profile features can be added later; the first section is "Passkeys".
- Passkey management on the profile page: list (vendor name + icon derived from the AAGUID, optional label, created date, last used date), add (max. 10 per user), rename label, delete (always allowed).
- AAGUID → vendor name/icon mapping uses a committed snapshot of the community list `passkey-authenticator-aaguids`.
- Admins cannot see a user's passkeys but can revoke all passkeys of a user from the user management modal.
- Disabled users cannot sign in with a passkey (existing `signIn` callback check applies).

## Capabilities

### New Capabilities
- `passkey-login`: Signing in with a passkey, feature flag, relying-party configuration, blocking of disabled users and of passkey-based account registration.
- `passkey-management`: Registering, listing, labeling and deleting own passkeys incl. fresh-login window, per-user limit, vendor display, and admin revocation of all passkeys of a user.
- `user-profile`: Profile page for every signed-in user, reachable from the user menu, with an extensible section layout.

### Modified Capabilities
<!-- none: no existing specs in openspec/specs/ -->

## Impact

- **Dependencies**: `@simplewebauthn/server`, `@simplewebauthn/browser` (peer deps of the Auth.js WebAuthn provider; also used for custom registration).
- **Database (Prisma/SQLite migration)**: new `Authenticator` model (Auth.js shape + `label`, `aaguid`, `createdAt`, `lastUsedAt`); `Session` gains `createdAt` and `freshAuthAt`.
- **Auth**: `src/server/auth/config.ts` (Passkey provider, `experimental.enableWebAuthn`, `events.signIn`, adapter wrapper for `lastUsedAt`), `src/app/api/auth/[...nextauth]/route.ts` (reject WebAuthn `action=register`).
- **Env**: `src/env.js` (`AUTH_PASSKEY_DISABLED`), Docker README / docker-compose documentation (HTTPS + `AUTH_URL` requirement, domain change invalidates passkeys).
- **API**: new tRPC `passkey` router; admin `userManagement` router gets `revokeAllPasskeys`.
- **UI**: user menu (`navbar/User.tsx`), new `/profile` route and components, admin `UserModal`, `en.json`/`de.json` translations.
- **Data**: new committed JSON snapshot of AAGUID vendor data.
- **Docs**: CHANGELOG entry.
