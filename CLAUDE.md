# Instructions for Claude

- This repo is the live app. Vercel project `sagar-together` (team "Together") deploys `main` to https://sagar-together.vercel.app on every push.
- The owner wants every requested change published automatically: after `npm test` and `npm run build` pass, merge the work into `main` and push, then confirm the new version is live. No need to ask first.
- Bump the `?v=` cache-busting version in `public/index.html` when changing frontend files so phones pick up the update.
- The repo `sagaradhikari7777-byte/together` is an old, outdated copy. Do not work there.
