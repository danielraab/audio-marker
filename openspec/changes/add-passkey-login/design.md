## Context

Auth is handled by `next-auth` 5.0.0-beta.32 (`@auth/core` 0.41.3) with the Prisma adapter on SQLite and the **database** session strategy. Providers are Authentik (OIDC) and Nodemailer (magic link), each enabled only when configured. The default Auth.js sign-in page is used. The user menu (`src/app/_components/global/layout/navbar/User.tsx`) has no profile entry; `/settings` is admin-only.

Constraints discovered while exploring:
- The Credentials provider cannot create database sessions, so passkey sign-in must go through the Auth.js WebAuthn/Passkey provider (experimental, needs `experimental.enableWebAuthn` and an `Authenticator` model).
- The Auth.js WebAuthn `register` action creates a **new user** when called signed-out with an unknown email, bypassing `MAIL_REGISTRATION_ENABLED`.
- Auth.js does not persist the AAGUID, has no label/created/last-used fields, and offers no hook to gate registration (fresh-login window, limit).
- Auth.js derives the relying party from the request URL by default (`id ?? url.hostname`, `origin ?? url.origin`).
- `Session` only stores `expires`; the adapter's `createSession` does not know which provider was used. `events.signIn({ user, account })` runs right after session creation and knows `account.provider`.
- With the database strategy, the `session` callback receives the full DB session row (`{ ...session, user }`), so extra `Session` columns are available there.

## Goals / Non-Goals

**Goals:**
- Passkey sign-in via the custom, translated sign-in page.
- Full control over registration: fresh-login window (email/Authentik only, 5 min), max 10, AAGUID capture, optional label, no account creation.
- Vendor name + icon per passkey from a local AAGUID snapshot.
- Extensible `/profile` page for all users; admin "revoke all passkeys".
- One source of truth for the relying party.

**Non-Goals:**
- Conditional UI (passkey autofill).
- Enforcing vendor allow/deny lists or attestation verification (`attestation: "none"`).
- Passkey-only accounts / sign-up via passkey.
- Admin visibility of individual passkeys.
- Multiple relying-party origins (one domain per instance).

## Decisions

### D1: Split — custom registration, Auth.js sign-in
Registration is implemented in a tRPC `passkey` router using `@simplewebauthn/server`; sign-in uses Auth.js `Passkey({ relayingParty })`. Registration writes rows in exactly the shape Auth.js reads during authentication:
- `Account { userId, type: "webauthn", provider: "passkey", providerAccountId: <base64 credentialID> }`
- `Authenticator { credentialID: <base64>, userId, providerAccountId: <same>, credentialPublicKey: <base64>, counter, credentialDeviceType, credentialBackedUp, transports, aaguid, label, createdAt, lastUsedAt }`

Auth.js uses **standard base64** (not base64url) and normalizes the browser's credential id via `Buffer.from(id, "base64")`. The row shape is pinned at compile time (`satisfies AdapterAccount` / `AdapterAuthenticator`) and by a unit test reproducing Auth.js' lookup (`src/server/auth/passkey/credentials.ts`).

Both rows are created/deleted together in one transaction.

*Alternative:* Auth.js register flow + route wrapper for the time check + post-hoc label. Rejected: no AAGUID, no limit/duplicate control inside the flow, and the account-creation path stays open. *Trade-off:* coupling to the experimental Auth.js data shape → mitigated by a unit test pinning encoding and field names (see Risks).

### D2: Block Auth.js `register`
Auth.js can start a registration in two ways, both closed:
- Signed-out with an unknown email (implicit sign-up): the provider's `getUserInfo` returns `null`, so Auth.js never infers `register`, and the custom sign-in page offers no field to enter one.
- Signed-in with explicit `action=register`: `src/app/api/auth/[...nextauth]/route.ts` wraps `GET` and returns 403 for `/webauthn-options/passkey?action=register`. Without these options no signed register challenge cookie exists, so the `register` callback cannot succeed either.

### D2a: Custom, translated sign-in page
The default Auth.js sign-in page cannot be translated (hardcoded English labels, provider names fixed at startup) and only loads its WebAuthn client script with conditional UI; without it the passkey button posts the bare form and Auth.js fails with "Invalid action parameter". A custom page `/signin` (next-intl) replaces it via `pages.signIn`, also serving as `pages.error`, plus `/signin/verify-request` for the email link notice. It renders the configured providers (reduced to `id`, `name`, `type`): OAuth buttons and the email form via `next-auth/react`, the passkey button via `next-auth/webauthn`.

`enableConditionalUI` stays `false` with `formFields: {}`; otherwise Auth.js requires a form field with `autocomplete="webauthn"` (`MissingWebAuthnAutocomplete`).

### D3: Fresh-login window on the session row
Prisma `Session` gets `createdAt DateTime @default(now())` and `freshAuthAt DateTime?`. `events.signIn` sets `freshAuthAt = now()` on the user's newest session when `account.provider ∈ {"authentik", "nodemailer"}`; passkey sign-ins leave it `null`. The `session` callback exposes a derived `passkeyAddableUntil = freshAuthAt + 5 min` (or `null`) server-side; the tRPC procedures re-check it on `getRegistrationOptions` and `verifyRegistration`.

*Alternative:* `User.lastStrongLoginAt`. Rejected: a strong sign-in on device A would open the window for an existing passkey session on device B. *Accepted race:* two simultaneous sign-ins of the same user could stamp the wrong session — negligible.

The window length is a constant `PASSKEY_REGISTRATION_WINDOW_MS = 5 * 60 * 1000` in a shared module (no env var, YAGNI).

### D4: Registration challenge storage
The challenge is stored in the existing `VerificationToken` table with `identifier = "passkey-registration:<userId>"`, `expires = now + 5 min`; issuing new options replaces the previous challenge, verification consumes it. No new table needed.

*Alternative:* signed cookie. Rejected: more moving parts (signing, cookie handling in tRPC) for no benefit.

### D5: Relying party from `AUTH_URL`
`src/server/auth/passkey/config.ts` exports `passkeyConfig` (`{ enabled: false }` or `{ enabled: true, relyingParty: { id: url.hostname, origin: url.origin, name: "Audio Marker" } }`), resolved from `AUTH_PASSKEY_DISABLED` and `AUTH_URL`. Both the Auth.js provider config and the tRPC router use it. `AUTH_URL` is added to `src/env.js` as optional URL; when missing while passkeys are not disabled, a warning is logged at runtime (not during `next build`).

### D6: Last-used via adapter wrapper
`PrismaAdapter(db)` is wrapped so `updateAuthenticatorCounter(credentialID, counter)` also sets `lastUsedAt = now()`. Auth.js calls it after every successful authentication (also for synced passkeys with counter 0).

### D7: AAGUID vendor snapshot
`src/server/auth/passkey/aaguids.json` is a committed snapshot of the curated `aaguid.json` from `github.com/passkeydeveloper/passkey-authenticator-aaguids` (~430 KB; `combined_aaguid.json` adds the FIDO MDS and is ~7 MB). Entries contain name, `icon_light`, `icon_dark` as data URIs. `resolveAuthenticatorVendor(aaguid)` (`vendors.ts`) returns `{ name, iconLight, iconDark }` with `null`s for unknown/zero AAGUIDs (the client shows a translated "Unknown authenticator" and a key icon). Only vendor data for the user's own passkeys is sent to the client. `pnpm run passkey:update-aaguids` (`scripts/update-aaguids.ts`) refreshes the snapshot and drops icons that are not image data URIs. Icons are rendered as images (`next/image`), never injected as HTML, to avoid SVG script execution.

### D8: tRPC API
`passkey` router (all `protectedProcedure`, all throw `FORBIDDEN` when passkeys disabled):
- `list` → `{ passkeys, maxPasskeys: 10, addableUntil: string | null }`; passkeys with resolved vendor, credential ID as id, no public key
- `getRegistrationOptions` → checks window + limit, `excludeCredentials` = user's credentials, `attestationType: "none"`, `residentKey: "required"`, `userVerification: "required"` (same as the Auth.js Passkey sign-in)
- `verifyRegistration({ response, label? })` → re-checks window + limit, consumes challenge, verifies, stores rows (D1)
- `rename({ id, label })` → label `z.string().trim().max(50)`, empty → `null`
- `delete({ id })` → ownership check, deletes Account + Authenticator; no window check

Admin `userManagement.revokeAllPasskeys({ userId })` → admin check (existing pattern), deletes all `passkey` accounts + authenticators of the user; works regardless of the feature flag.

### D9: UI
- User menu: new "Profile" item (`UserRound` icon) for all signed-in users → `/profile`.
- `src/app/profile/page.tsx` (server, redirect if signed out) renders `ProfilePage` with a list of section components; first section `PasskeySection` (only when enabled), otherwise an empty state.
- `PasskeySection`: list (icon, vendor, label with inline edit, created, last used, delete with confirm modal), "Add passkey" button with optional label input, info text when the window is closed or the limit is reached. A client timer based on `addableUntil` disables the button at expiry.
- `UserModal`: "Revoke all passkeys" button with confirmation.
- Texts in `src/messages/en.json` and `de.json`.

## Risks / Trade-offs

- [Auth.js WebAuthn is experimental; data shape may change on upgrade] → Unit test pinning the row shape written by registration against what `@auth/core` reads; pin `next-auth` version; note in CHANGELOG.
- [Domain change invalidates all passkeys] → Documented in Docker README; users fall back to email/Authentik.
- [WebAuthn requires HTTPS (except localhost)] → Documented; misconfiguration only affects passkeys, other providers keep working.
- [`AUTH_URL` mismatching the real public URL breaks verification] → Documented; single derivation point makes the cause obvious.
- [AAGUID snapshot goes stale] → Fallback name; update script.
- [Icons from third-party list are SVG data URIs] → Rendered only via `<img>`, never `dangerouslySetInnerHTML`.
- [Existing `session` callback spread the full DB session row (incl. `sessionToken`) into the client session payload] → Confirmed and fixed: the callback returns only whitelisted fields.
- [A user whose passkey was deleted/revoked gets Auth.js' generic "Configuration" error page when trying it] → Accepted for now (Auth.js behavior); other sign-in methods keep working.
- [`@simplewebauthn/server` v9 (required by Auth.js) has advisory GHSA-6hxq-p678-4hr2 about attestation trust chains] → Not applicable: `attestationType: "none"`, attestation is never trusted; upgrade together with Auth.js.
- [Existing sessions after deployment have `freshAuthAt = null`] → Users must sign in again with email/Authentik to add a passkey; expected.

## Migration Plan

1. Prisma migration: add `Authenticator` model; add `Session.createdAt` (default now, existing rows get migration time, normalized to Prisma's integer format so ordering works) and `Session.freshAuthAt` (nullable).
2. Deploy; passkeys are enabled automatically if `AUTH_URL` is set. Operators can opt out with `AUTH_PASSKEY_DISABLED=true`.
3. Rollback: set `AUTH_PASSKEY_DISABLED=true` (no data loss); a code rollback leaves the additive columns/table unused.

## Open Questions

- None. Verified with an end-to-end run (software authenticator against a production build): registration via tRPC, Auth.js sign-in, `lastUsedAt` update, `freshAuthAt` only for email sign-in, disabled users, delete.
