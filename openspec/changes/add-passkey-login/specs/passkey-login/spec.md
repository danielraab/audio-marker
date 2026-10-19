## ADDED Requirements

### Requirement: Passkey sign-in
The system SHALL allow a user with at least one registered passkey to sign in using that passkey via the default Auth.js sign-in page.

#### Scenario: Sign-in button shown
- **WHEN** passkeys are enabled and a visitor opens the sign-in page
- **THEN** the page shows a "Sign in with Passkey" button alongside the other configured providers

#### Scenario: Successful passkey sign-in
- **WHEN** a user authenticates with a passkey registered to their account
- **THEN** a database session is created for that user and they are signed in

#### Scenario: Unknown passkey
- **WHEN** a visitor authenticates with a passkey that is not registered in the system
- **THEN** sign-in fails and no session or user is created

### Requirement: Passkey feature flag
The system SHALL enable passkeys by default and SHALL disable them when the env variable `AUTH_PASSKEY_DISABLED` is `true` or when `AUTH_URL` is not set.

#### Scenario: Disabled via flag
- **WHEN** `AUTH_PASSKEY_DISABLED=true`
- **THEN** the passkey provider is not registered, the sign-in page shows no passkey button, and all passkey API procedures for users are rejected

#### Scenario: Missing AUTH_URL
- **WHEN** `AUTH_PASSKEY_DISABLED` is not `true` but `AUTH_URL` is not set
- **THEN** passkeys are treated as disabled and a warning is logged at startup

#### Scenario: Re-enabling keeps data
- **WHEN** passkeys are disabled and later enabled again
- **THEN** previously registered passkeys work again without re-registration

### Requirement: Consistent relying party
The system SHALL derive the WebAuthn relying party ID (hostname) and origin from `AUTH_URL` and SHALL use the same values for passkey sign-in and passkey registration.

#### Scenario: Registered passkey usable for sign-in
- **WHEN** a passkey is registered on the profile page and the user later signs in with it on the same domain
- **THEN** verification succeeds because registration and sign-in use the identical relying party ID and origin

### Requirement: No account creation via passkey
The system SHALL NOT create new user accounts through passkeys; the Auth.js WebAuthn `register` action SHALL be rejected.

#### Scenario: Register action blocked
- **WHEN** a request is sent to the Auth.js WebAuthn endpoint with `action=register`
- **THEN** the request is rejected and no user, account or authenticator is created

### Requirement: Disabled users blocked
The system SHALL reject passkey sign-in for users that are disabled.

#### Scenario: Disabled user signs in with passkey
- **WHEN** a disabled user authenticates with a valid passkey
- **THEN** sign-in is rejected and no session is created

### Requirement: Last-used tracking
The system SHALL record the timestamp of the last successful sign-in for each passkey.

#### Scenario: Last used updated
- **WHEN** a user signs in successfully with a passkey
- **THEN** that passkey's last-used timestamp is set to the current time
