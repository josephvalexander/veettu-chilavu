// ─────────────────────────────────────────────────────────────
//  LOCAL DEVELOPMENT CONFIG
//  This file is gitignored — it never gets committed or deployed.
//  For production, the Client ID is injected by GitHub Actions
//  from the GOOGLE_CLIENT_ID repository secret.
//
//  HOW TO USE FOR LOCAL TESTING:
//  1. Copy this file (it's already named config.local.js)
//  2. Paste your real Client ID below
//  3. In index.html, temporarily change __GOOGLE_CLIENT_ID__
//     to your real ID while testing locally, then revert before push.
//     OR use a local build script (see README).
// ─────────────────────────────────────────────────────────────

// Your Google OAuth 2.0 Client ID
// Get it from: console.cloud.google.com → APIs & Services → Credentials
const LOCAL_CLIENT_ID = 'PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
