# Netlify to Vercel transfer — completed

On 24 September 2026, the protected transfer copied and verified 2 households,
9 expenses, 2 sheets and 3 claimed member identities. No settlement records existed.
The destination preserves the exact source household JSON, including private access
key hashes, creator IDs and receipts. Netlify records were not changed.

Production: https://sagar-together.vercel.app

Use Join or sign in on the new site and paste the existing private access link.
The app extracts its credentials and signs into the new backend. Save the new
private access link and use the Vercel app for all subsequent entries.

The migration endpoint and token verifier have been removed. The insert-only
transfer helper and regression tests remain for auditability.

Cleanup for the project owner: remove TOGETHER_MIGRATION_DATABASE_URL from
Vercel Production environment variables. It is no longer used by the app.
User sign-in on their own device is the remaining acceptance check.
