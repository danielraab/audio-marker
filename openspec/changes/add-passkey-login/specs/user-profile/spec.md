## ADDED Requirements

### Requirement: Profile page
The system SHALL provide a `/profile` page accessible to every signed-in user, composed of independent sections so further profile features can be added without restructuring the page.

#### Scenario: Signed-in user
- **WHEN** a signed-in user (admin or not) opens `/profile`
- **THEN** the profile page is shown

#### Scenario: Not signed in
- **WHEN** a visitor who is not signed in opens `/profile`
- **THEN** they are redirected to the home page

#### Scenario: No sections available
- **WHEN** no profile section is enabled (e.g. passkeys disabled)
- **THEN** the page still renders with an informational empty state

### Requirement: Profile entry in user menu
The system SHALL show a "Profile" entry in the user menu for every signed-in user, navigating to `/profile`.

#### Scenario: Menu entry
- **WHEN** a signed-in user opens the user menu
- **THEN** a "Profile" entry is shown between the signed-in info and the settings/sign-out entries

#### Scenario: Navigation
- **WHEN** the user selects "Profile"
- **THEN** the browser navigates to `/profile`

### Requirement: Translations
The system SHALL provide all new profile and passkey UI texts in English and German.

#### Scenario: German locale
- **WHEN** the UI language is German
- **THEN** all profile and passkey texts are shown in German
