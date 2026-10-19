## ADDED Requirements

### Requirement: List own passkeys
The system SHALL show a signed-in user the list of their own passkeys on the profile page, each with vendor name, vendor icon (if known), optional label, creation date and last-used date.

#### Scenario: Passkeys listed
- **WHEN** a user with registered passkeys opens the passkeys section of the profile page
- **THEN** each passkey is shown with vendor name, icon, label, created date and last-used date (or "never used")

#### Scenario: Only own passkeys
- **WHEN** a user requests the passkey list
- **THEN** only passkeys belonging to that user are returned

#### Scenario: Count shown
- **WHEN** the passkey list is displayed
- **THEN** the current count and the maximum of 10 are shown

### Requirement: Vendor identification via AAGUID
The system SHALL store the AAGUID of each registered passkey and SHALL map it to a vendor name and icon using a committed snapshot of the community list `passkey-authenticator-aaguids`.

#### Scenario: Known AAGUID
- **WHEN** a passkey's AAGUID exists in the snapshot
- **THEN** the vendor name and icon from the snapshot are displayed

#### Scenario: Unknown or zero AAGUID
- **WHEN** a passkey's AAGUID is missing from the snapshot or is all zeros
- **THEN** a generic "Unknown authenticator" name and a generic key icon are displayed

#### Scenario: No external request
- **WHEN** vendor information is resolved
- **THEN** no request to an external service is made

### Requirement: Add passkey within fresh-login window
The system SHALL allow a signed-in user to add a passkey only within 5 minutes after the current session was established by a sign-in with email or Authentik. A sign-in with a passkey SHALL NOT open this window. The check SHALL be enforced on the server for both generating registration options and verifying the registration.

#### Scenario: Within window
- **WHEN** a user signed in via email or Authentik less than 5 minutes ago and clicks "Add passkey"
- **THEN** the browser passkey dialog opens and, on success, the passkey is stored for the user

#### Scenario: Window expired
- **WHEN** more than 5 minutes have passed since the fresh sign-in
- **THEN** the "Add passkey" button is disabled and an info text explains that a new sign-in with email or Authentik is required to add a passkey

#### Scenario: Session from passkey sign-in
- **WHEN** the current session was established via passkey sign-in
- **THEN** the "Add passkey" button is disabled and the info text is shown

#### Scenario: Window expires during registration
- **WHEN** the registration options were issued within the window but the verification request arrives after the window has expired
- **THEN** the server rejects the registration and no passkey is stored

#### Scenario: UI updates when window expires
- **WHEN** the profile page is open while the window expires
- **THEN** the button becomes disabled and the info text appears without a page reload

### Requirement: Optional label
The system SHALL allow the user to set, change or clear an optional label (max. 50 characters) for each of their passkeys.

#### Scenario: Label on creation
- **WHEN** a user enters a label while adding a passkey
- **THEN** the passkey is stored with that label

#### Scenario: Rename
- **WHEN** a user edits the label of an existing passkey
- **THEN** the new label is saved; an empty value clears the label

#### Scenario: Rename foreign passkey
- **WHEN** a user tries to rename a passkey that does not belong to them
- **THEN** the request is rejected

### Requirement: Passkey limit
The system SHALL limit the number of passkeys per user to 10.

#### Scenario: Limit reached
- **WHEN** a user already has 10 passkeys
- **THEN** the "Add passkey" button is disabled with an info text and the server rejects further registrations

### Requirement: Duplicate prevention
The system SHALL prevent registering the same authenticator twice for a user.

#### Scenario: Same authenticator again
- **WHEN** a user tries to add a passkey on an authenticator that already holds one of their registered passkeys
- **THEN** the authenticator refuses creation (excluded credentials) and nothing is stored

### Requirement: Delete own passkey
The system SHALL allow a user to delete any of their own passkeys at any time, independent of the fresh-login window, after a confirmation.

#### Scenario: Delete
- **WHEN** a user confirms deletion of one of their passkeys
- **THEN** the passkey is removed and can no longer be used for sign-in

#### Scenario: Delete foreign passkey
- **WHEN** a user tries to delete a passkey that does not belong to them
- **THEN** the request is rejected and nothing is deleted

### Requirement: Admin revokes all passkeys
The system SHALL allow an admin to revoke all passkeys of a user from the user management modal without seeing the individual passkeys.

#### Scenario: Revoke all
- **WHEN** an admin confirms "Revoke all passkeys" for a user
- **THEN** all passkeys of that user are deleted and can no longer be used for sign-in

#### Scenario: No passkey details for admins
- **WHEN** an admin opens a user in user management
- **THEN** no passkey list, labels, vendors or count are shown

#### Scenario: Non-admin
- **WHEN** a non-admin calls the revoke-all procedure
- **THEN** the request is rejected

### Requirement: Management hidden when disabled
The system SHALL hide the passkeys section of the profile page when passkeys are disabled.

#### Scenario: Feature disabled
- **WHEN** passkeys are disabled
- **THEN** the profile page does not show the passkeys section and the admin "Revoke all passkeys" action remains available
