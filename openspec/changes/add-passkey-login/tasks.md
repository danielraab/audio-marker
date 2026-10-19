## 1. Setup

- [x] 1.1 Create branch `feature/passkey-login`
- [x] 1.2 Add `@simplewebauthn/server` and `@simplewebauthn/browser` dependencies
- [x] 1.3 Add `AUTH_URL` (optional URL) and `AUTH_PASSKEY_DISABLED` (boolean string, default false) to `src/env.js`

## 2. Database

- [x] 2.1 Add `Authenticator` model (Auth.js shape + `label`, `aaguid`, `createdAt`, `lastUsedAt`) with relation on `User`
- [x] 2.2 Add `Session.createdAt` and `Session.freshAuthAt`
- [x] 2.3 Generate Prisma migration and verify it applies on an existing SQLite DB

## 3. Passkey core module

- [x] 3.1 Create `src/server/auth/passkey/config.ts` with `passkeyConfig` (enabled + relying party), registration window helpers, `PASSKEY_REGISTRATION_WINDOW_MS`, `MAX_PASSKEYS_PER_USER` and one-time warning when `AUTH_URL` is missing
- [x] 3.2 Add unit tests for config resolution and registration window
- [x] 3.3 Commit AAGUID snapshot `src/server/auth/passkey/aaguids.json` and add `scripts/update-aaguids.ts` (`pnpm run passkey:update-aaguids`)
- [x] 3.4 Implement `resolveAuthenticatorVendor(aaguid)` with fallback for unknown/zero AAGUIDs + unit tests

## 4. Auth.js integration

- [x] 4.1 Register `Passkey({ relayingParty })` provider and `experimental.enableWebAuthn` only when enabled
- [x] 4.2 Wrap `PrismaAdapter` so `updateAuthenticatorCounter` also sets `lastUsedAt`
- [x] 4.3 Add `events.signIn` that sets `freshAuthAt` on the user's newest session for `authentik`/`nodemailer` sign-ins
- [x] 4.4 Expose `passkeyAddableUntil` via the `session` callback; whitelist returned fields (`sessionToken` leak confirmed and fixed)
- [x] 4.5 Wrap `[...nextauth]` route handlers to reject WebAuthn `action=register` with 403 + test; `getUserInfo` returns `null` (no implicit sign-up); conditional UI disabled
- [x] 4.6 Verify disabled users are rejected on passkey sign-in by the existing `signIn` callback

## 5. tRPC API

- [x] 5.1 Create `passkey` router with `list` (incl. limit and window info) (vendor resolved, no credential secrets exposed)
- [x] 5.2 Implement `getRegistrationOptions` (window + limit check, `excludeCredentials`, challenge in `VerificationToken`)
- [x] 5.3 Implement `verifyRegistration` (re-check window + limit, consume challenge, verify, create Account + Authenticator in a transaction)
- [x] 5.4 Implement `rename` and `delete` with ownership checks (delete removes Account + Authenticator)
- [x] 5.5 Add `revokeAllPasskeys` to admin `userManagement` router
- [x] 5.6 Register `passkey` router in `src/server/api/root.ts`
- [x] 5.7 Add tests: window logic, limit, label validation, ownership, Account/Authenticator row shape matches what `@auth/core` reads

## 6. UI

- [x] 6.1 Add "Profile" item to user menu (`navbar/User.tsx`)
- [x] 6.2 Create `src/app/profile/page.tsx` (redirect when signed out) and `ProfilePage` with section layout + empty state
- [x] 6.3 Create `PasskeySection`: list with vendor icon/name, label inline edit, created/last used, delete with confirm
- [x] 6.4 Add "Add passkey" flow with optional label (`startRegistration` from `@simplewebauthn/browser`), disabled state + info text for expired window / limit reached, client timer on `addableUntil`
- [x] 6.5 Add "Revoke all passkeys" with confirmation to admin `UserModal`
- [x] 6.6 Add English and German translations; ensure `messages.test.ts` passes

## 7. Docs & verification

- [x] 7.1 Document `AUTH_URL` / `AUTH_PASSKEY_DISABLED`, HTTPS requirement and domain-change caveat in `docker/README.Docker.md` and docker-compose example
- [x] 7.2 Add CHANGELOG entry
- [x] 7.3 Manual test: register passkey after email sign-in, sign in with passkey, window expiry, limit, delete, admin revoke, feature disabled (backend flow verified end-to-end with a software authenticator; real device + UI pending)
- [x] 7.4 Run `pnpm run check` and `pnpm test:run` until green
