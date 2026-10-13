# Beta launch and owner access

These features are implemented locally. No live provider configuration, migration,
account approval or deployment has been performed by this task.

## Assign your account privately

Complete `accounts-and-guests.md` first (Firebase identity and the database token
bridge). Apply all three SQL migrations in filename order. With the Supabase SQL
editor or a trusted service-role connection, set **your Firebase UID**, not an email:

```sql
UPDATE public.beta_config SET owner_uid = 'YOUR_FIREBASE_UID' WHERE id = true;
```

Sign in with that exact account and choose **Beta & feedback → Owner control room**.
Only that server-configured UID can load applications, accept/decline requests,
read feedback and change limits. No browser flag grants admin access. An unassigned
owner fails closed. Changing the UID through the SQL editor transfers access.

## Initial limits

| Resource | Initial enforced limit |
| --- | ---: |
| Approved beta members | 1,000, plus the separately configured owner |
| Permanent buildings per member | 20 |
| Permanent buildings for the owner | 1,000 |
| Permanent projects across the platform | 10,000 |
| Anonymous buildings | 20 per tab, expiring after 24 hours |
| Feedback | 5 messages per member per rolling 24 hours |

One project is one building. Owner quotas and member quotas are separate. Total
quota still applies to the owner. Limits are adjustable through the protected panel.
Reducing a per-person quota below usage prevents new projects without deleting
existing ones. Member and total-project caps cannot be reduced below current usage.
Concurrent approvals and inserts serialize on the settings row; stable-ID save
retries consume no additional place. Existing Firebase identities are not
implicitly approved. Existing project owners must request beta access to edit or
publish after this migration. Owner deletion of their own data remains allowed.

The 1,000 cap applies to approved **application members**, not the number of Firebase
identities. Visitors first establish an identity, then request admission. This is
not a pre-authentication email waitlist. Pending/rejected visitors can still explore
and make temporary ideas. Firebase anti-abuse, signup quotas and provider settings
must be configured in Firebase for a public beta. No email notification is promised;
applicants check their status under Beta & feedback (refresh/reopen after review).
The queue uses the email from a verified Firebase token only, and always displays
the Firebase UID. Identities without a verified email have an explicit unverified
label; client-supplied contact emails cannot impersonate a trusted applicant.
Only the applicant's own status is exposed. Owner queue shows the oldest 200 pending
requests; processing them reveals the next batch. Feedback shows the latest 100.

### Server imports and restores

The insert trigger intentionally applies beta identity and quotas to all normal
project inserts, including service-role requests. A bare SQL seed without Firebase
claims is rejected. Do not add a `current_user` bypass: this trigger is SECURITY
DEFINER, so that value identifies the function owner even for client requests.
A trusted database administrator performing a bulk restore must explicitly plan
trigger handling, quota reconciliation and backups as part of the restore. Bulk
imports are not provided by the owner panel.

## Zero Hub and views

Every project with fewer than 100 recorded unique beta-member views is in Zero Hub.
Opening the actual project detail records at most one view per approved UID for
that project, forever. Creator views, anonymous visits and repeated opens do not
count. These are recorded app views, not independently verified impressions or
proof of distinct humans. Existing projects begin at zero recorded views when this
feature is installed; their existing followers/history are not reset.

At 100, a project leaves Zero Hub and appears in its original category district;
category/status are never rewritten. Abandoned graduated projects can also be
inspected in the separate Graveyard city. Echo, Network and search can still inspect
ideas at any count. Counts refresh on load or after the viewer opens a project;
this implementation does not subscribe to live updates across browsers. Drafts
always stay in Zero Hub and cannot earn platform badges. Server-owned metrics and
private per-UID view records cannot be overwritten through client table writes.

## Capacity is not a performance promise

The database quotas above are product limits, not measured hosting capacity.
Project records load 500 at a time, with a Load more action in city project lists.
City/Hub/Zero scenes render at most 120 project buildings and keep a selected
record in that set. Background scenery and inhabitants are separate instanced
batches. The full loaded list remains inspectable. Large Echo/Network graphs and
real-device FPS still need profiling. Test production traffic, hosting/database
plan limits, authentication quotas and real mobile GPUs before increasing users.

Weather is optional local scenery (clear/summer/rain/snow), applied inside districts
and Zero Hub. It does not report real weather. Reduced Effects reduces precipitation
and NPCs; reduced motion freezes weather and inhabitants. Pip has three short cards,
a Skip button, and can be reopened using Ask Pip. Its dismissal is local to the browser.

## Verification before going live

Verify owner login, non-owner denial, registration/approval at the configured cap,
publishing quotas, private feedback, 99→100 unique views, migration compatibility,
logout and a second browser/account. Local SQL and browser fixture checks are not
a substitute for this deployed integration check.

### Reproduce the isolated SQL security checks

The optional test harness runs real PostgreSQL in PGlite without contacting providers.
Its dependency is kept outside the app (no shipping dependency added):

```bash
npm install --prefix /tmp/reboot-sql-tests @electric-sql/pglite@0.3.14
cp tests/beta-database.mjs /tmp/reboot-sql-tests/check.mjs
REBOOT_APP_ROOT="$PWD" node /tmp/reboot-sql-tests/check.mjs
```

Run from `reboot-worlds-v22`. It creates disposable roles, synthetic requests and
projects in memory and asserts access denial, quotas, privacy and unique-view counts.
