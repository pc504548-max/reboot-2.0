# Accounts and temporary ideas

## Guest behavior

Visitors can create up to 20 temporary projects without contacting a provider.
Projects and saved building appearance live in sessionStorage in the current
browser tab, survive refresh, and expire 24 hours after creation. Closing the tab
normally clears them; browser session restore can restore sessionStorage until
the expiry timestamp. A 30-second sweep removes expired records while open.
When browser storage is blocked, drafts are memory-only and will not survive refresh.

After signing in and receiving beta approval, open **My temporary ideas** and choose **Save to account**.
This explicitly publishes each project. Failed requests retain the draft. Stable
UUIDs and owner-protected upserts make promotion retries idempotent. No guest
record is inserted remotely until this action. Discard removes only temporary
records. Guest figures are fictional; they are not other users.

## Authentication repair

The old callback used the service-role API key as an HMAC signing secret and
reused an access token as a refresh token. Neither represents a valid Supabase
session. The new callback verifies Firebase RS256 signatures against Google's
JWKS key array, checks issuer/audience/subject/times, and signs a 15-minute
PostgREST token with the project's JWT signing secret. It never mints a refresh
token or pretends the user is a Supabase Auth user.

The database client uses Supabase's accessToken callback. Tokens are cached in
memory per Firebase UID, deduplicated while requesting, and discarded on identity changes/signout. Expired database tokens are exchanged again using Firebase’s current ID token. Firebase owns login persistence and refresh. No database JWT is
stored in browser storage. Existing project RLS compares `firebase_uid` to the
verified custom claim. Saving errors leave the draft intact and remain visible.

Email login, signup, password reset, Google/GitHub popup login, logout, and useful
provider error messages are available. Account forms open immediately. Unconfigured
previews explicitly offer guest access. VITE_LOCAL_PREVIEW=true also skips remote project reads, so this mode needs no placeholder data server.

## Deployment requirements (not applied to a live service in this task)

1. Set the public values from `.env.example` for your Firebase and Supabase projects.
   Set `VITE_LOCAL_PREVIEW=false` for real sign-in.
2. Enable the desired Firebase providers and authorize the actual application
   hostname. Configure each OAuth provider's callback in Firebase and its provider.
3. Apply the existing projects migration, followed by
   `20261013000000_project_building_customization.sql`. It adds optional appearance,
   lessons and revival-requirement fields; existing owner RLS is preserved.
4. In Supabase Edge Function secrets, configure `FIREBASE_PROJECT_ID` and
   `REBOOT_SUPABASE_JWT_SECRET` with the Supabase project's **legacy JWT signing
   secret**. This must be a signing secret accepted by that project's database API,
   not an anon key, service-role key or Firebase secret. Never expose it as a
   `VITE_*` variable. Projects without legacy JWT verification need a different
   server signing integration before this bridge can be deployed.
5. Deploy `auth-callback` with the supplied function config (`verify_jwt=false`).
   The function verifies Firebase itself before issuing anything. Missing server
   configuration fails closed with 503; invalid identities fail with 401.
6. Verify a real login, owner insert/update, another-account write rejection,
   token expiry, password reset and logout against the deployed services.

The sandbox has no live provider configuration. Cryptographic and store tests
use synthetic identities and generated RSA keys; they do not prove live login,
email delivery or database policy execution. No live migration/deployment was performed.

## Environment refinement

Existing city landmarks remain. All 11 terrains now have distinct cross sections;
background buildings use authored clusters with halls, gateways and tall structures.
The UI names the planet Reboot. **Hide interface** provides an unobstructed view.
Landmarks open actual project records, achievement criteria or a clearly labeled
restoration preview. Only owners or temporary-draft holders can save revival status.
Appearance editing now works inside destination scenes and can be saved.
Instanced mechanical fauna and residents react to selections. Animations pause
when the document is hidden and honor reduced motion/effects. These choices reduce
work, but real-device frame rates are still to be profiled.

No external model packs or application dependencies were added. The existing
open-source Three.js / React Three Fiber stack supplies the geometry and animation.

Beta approvals, owner assignment, quotas, feedback and Zero Hub are documented in `beta-operations.md`. Apply its third migration before using the current project client.
