# BRL Required User Agreement Update

This is the detailed user agreement and required-access implementation for the existing IRL Racing app. It is prepared and tested locally, not deployed to Vercel or installed in your live Supabase project.

## Read the agreement

`docs/legal/BRL_User_Agreement.md` contains the approximately 3,400-word draft. The app displays the same sections from the authoritative database document. It covers eligibility, electronic acceptance, account security, racing and league conduct, separate driver/owner/admin duties, required salary and funding responsibilities, virtual credits, uploads, privacy, AI, app ownership, copying restrictions, investigations, appeals, disclaimers and changes.

The selected policy is **18 and older**. There is no parent-consent workflow and existing members are not grandfathered. The super administrator must accept personally, just like every other member. Machine service/cron access remains available for trusted workers; that is not an interactive administrator exemption.

Have qualified counsel review the draft before production publication. In particular, confirm the operator's legal identity/contact method, actual privacy and retention practices, brand/content permissions and applicable law. The draft does not invent a company, address or enforceability guarantee. See `docs/legal/LEGAL_REVIEW_NOTES.md` for the primary sources and practical limits.

## Install in this order

1. Finish any pending authentication/career and team-funding database updates first. This update requires the existing `brl_memberships`, `brl_accounts` and `brl_my_access()` authentication workflow, Supabase roles and PostgreSQL 15 or newer.
2. In Supabase SQL Editor run **INSTALL_REQUIRED_USER_AGREEMENT.sql**. This is the one installer for this update. It is transactional, records no acceptance for existing members, and can be rerun. If it reports an unsupported exposed function/relation, do not deploy the frontend until that specific case is reviewed. Do NOT run the test fixtures in production.
3. Copy the included `supabase/functions/brl-register/index.ts` and `supabase/functions/brl-media/index.ts` into matching project paths. Redeploy **brl-register** and **brl-media** in Supabase. Keep existing JWT settings, shared media assets and secrets; no new secrets are required. Registration now requires an explicit adult confirmation. Human media requests also verify the account's agreement before service-role data access. Login/password recovery remain available so a member can authenticate and accept.
4. Copy all nine included `src/` files into matching GitHub paths and redeploy Vercel. Preserve your existing Supabase environment variables. This wraps the existing app and navigation before they mount; it does not replace the App.jsx application.
5. Test a fresh browser and an existing signed-in account. Before acceptance only login/registration and the readable agreement are available. Open `/user-agreement`, read the document, check both confirmations, and type the registered gamertag. Decline/sign-out leaves league access closed. After recorded acceptance the account receives only its existing approved permissions; a pending application remains pending.
6. Test your own super-admin account, a driver and an owner. Verify that both agreement and financial-cost acknowledgments remain separate where applicable. `docs/legal/ADMIN_VERIFY_ACCEPTANCES.sql` is a read-only query for the SQL Editor; it does not accept for anyone.

The cutover intentionally blocks league access until the backend gate and matching frontend are installed and the member accepts. Coordinate the SQL, function deployments and Vercel rollout together. A failed status request does not silently fall back to a local checkbox or a bundled draft.

## What is recorded

The authenticated account ID, server-registered gamertag, agreement version, server-calculated SHA-256 document fingerprint, adult attestation, role snapshot and server timestamp. No legal name, date of birth, password or new raw-IP field is collected for acceptance. Repeated clicks return the original acceptance timestamp. The API does not accept a target user ID, so an admin cannot record another member's consent through this workflow.

Members can print/save the terms and retrieve versions they previously accepted. Accepted document text and receipts are immutable through ordinary database updates. Material changes are a new version, never an edit to an earlier signature. Lawful retention/deletion requests still need the operator's documented, restricted maintenance process; immutable audit design is not a claim that privacy obligations disappear.

## Enforcement and permissions

- The entire existing app and navigation remain unmounted until the server confirms acceptance. Cached session roles or manually changing localStorage cannot grant access.
- `brl_my_access()` returns identity only and strips league roles until agreement acceptance. It does not create, promote, approve or otherwise modify an account's underlying permissions.
- Existing client-callable public SECURITY DEFINER SQL/PLpgSQL functions receive an agreement guard in place. Function OIDs, grants and dependencies are preserved. Earlier function definitions are backed up in a restricted maintenance table. A catch-all error handler inside an existing function cannot swallow the outer access guard.
- Existing public table access receives an additional restrictive RLS policy; existing row/role restrictions remain. Previously non-RLS tables retain their existing authorized access after acceptance. Public views use invoker security so the underlying RLS gate applies. If an existing view intentionally relied on owner-only base-table privileges, review its underlying grants rather than granting broad access to fix a permission error.
- Storage object policies receive the same restriction where Storage is installed. Public buckets, already-public source code, static JavaScript and CDN images are not made secret by an agreement. Confidential data and private source/assets need actual private hosting and storage configuration.
- Trusted service-role and database maintenance execution remains available. User-facing Edge Functions that use a service key must separately check the authenticated user's acceptance before private data access; the current media endpoint is patched here. Apply that same rule to any future user-facing service-role endpoint.

**After later backend migrations or new database APIs/tables**, run `SELECT public.brl_agreement_protect_app();` from the trusted SQL Editor to protect new or replaced functions/relations. New PostgreSQL tables and security-definer APIs do not automatically inherit this app-specific policy. Do not create a bypass or auto-accept members. Keep the agreement-aware access wrapper if changing the identity/login workflow.

## Publish a revised agreement

Edit `src/data/legal/userAgreement.json` and choose a genuinely new `version`. From the project root generate a reviewed publication script:

`node tools/publish-user-agreement.mjs src/data/legal/userAgreement.json reviewed-publication.sql`

Read that SQL and the agreement, then execute it in Supabase SQL Editor. The tool itself never connects to the database. It refuses changed text under an existing identifier and refuses reactivating an archived version. Changing the current version invalidates older access immediately at the database; the app checks again on focus and at least every minute. Members must affirmatively accept the new version. Rerunning this older installer does not downgrade an already published newer current version.

## Verification

The production Vite build passed. Isolated PostgreSQL/PGlite tests passed for anonymous, driver, owner and super-admin access; required adult/consent/gamertag/version/hash checks; direct table, view and security-definer RPC restrictions; preserved original permissions and function OIDs; SQL, PLpgSQL, set-returning and void functions; immutable/idempotent acceptance; renewed consent; private receipts; maintenance/service workers; and older-installer safety. React rendering checks passed for the complete role-specific text, unchecked controls, safe return paths, escaping and private app not mounting early. Actual Edge handlers were tested with isolated service mocks for age validation and user acceptance before service data access.

To reproduce the bundled database tests, install `@electric-sql/pglite` in a temporary directory, set `PGLITE_MODULE` to its absolute `dist/index.js`, and run `node tests/user-agreement-db.mjs` from this folder. The Edge test uses Node 24's TypeScript stripping: `node tests/user-agreement-edge.mjs`. No test connects to the live database. Never run fixture SQL against production.

Pre-existing nonblocking build warnings remain for the optional signature font and bundle size. The local build and isolated checks do not verify your live schema, live deployment, identity documents, actual copyright ownership or legal enforceability.
