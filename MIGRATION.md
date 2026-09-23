# Netlify to Vercel transfer

The Vercel app uses the existing Upstash REST settings. The original Netlify
database is still the source of existing household data. Nothing has been copied
until the protected transfer reports `copied-and-verified`.

## Connection setup

In Netlify, open Together → Data & Storage → Database → production branch,
then copy the connection string (prefer a read-only connection when offered).
In Vercel's Together project, add a **sensitive Production environment variable**:

`TOGETHER_MIGRATION_DATABASE_URL`

Its value is the source connection string. Never put it in Git, chat, screenshots,
or a client-side variable. Redeploy after saving it.

## Transfer protocol

The temporary `/api/migrate-netlify` endpoint accepts POST only, with a bearer
token whose SHA-256 verifier is in `lib/migration-access.json`. The token itself
is held outside the repository. Authorization expires on 30 September 2026 UTC.
After successful transfer, a destination completion marker disables repetition.

1. Pause entry on the old app while transferring.
2. Authorized POST with `{"apply":false}` checks the source and destination.
3. Authorized POST with `{"apply":true}` inserts missing household records.
4. Check counts, sign-in, receipts, ownership, sheets and settlement totals on
   Vercel before asking the household to switch. Existing private link fragments
   retain their credentials, but the new hostname needs to be used.
5. Remove the source connection variable, delete the migration endpoint and
   verifier, and deploy again after verification.

Source queries execute in a read-only Postgres transaction. The transfer keeps
the exact JSON including access-key hashes and creator IDs. It skips byte-identical
destination records, refuses conflicting records, verifies each copied value,
and checks the source again before marking completion. It does not delete or
modify Netlify data. If someone continues editing the source during transfer,
the transfer reports a conflict and needs review before the household switches.

Automated tests cover authorization, expiry, error redaction, original access and
ownership retention, insert-only conflicts, dry runs and completion behavior.
