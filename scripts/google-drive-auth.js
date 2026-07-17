#!/usr/bin/env node
/**
 * One-time helper: turns a Google OAuth client id/secret into the long-lived
 * refresh token that lib/googleDrive.ts uses to write backups into Drive.
 *
 * Run it once on your own machine (never on the server):
 *
 *   node scripts/google-drive-auth.js
 *
 * It opens a consent screen in your browser, catches the redirect on
 * http://localhost:5555, and prints GOOGLE_DRIVE_REFRESH_TOKEN. Paste that into
 * Vercel. Full walkthrough: docs/google-drive-backup.md
 *
 * No npm dependency: plain node http + fetch (node 18+).
 */

const http = require('http');
const readline = require('readline');
const { spawn } = require('child_process');

// drive.file only grants access to files this app creates. It is deliberately
// NOT the full `drive` scope: that one is "restricted", needs a Google
// verification review to publish, and would expose the whole company Drive if
// the token ever leaked.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}`;

const ask = (q) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
};

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'explorer'
    : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try { spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref(); } catch { /* print-only fallback */ }
}

// Resolves with the ?code= Google sends back to the loopback redirect.
function waitForCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        `<html><body style="font-family:system-ui;padding:40px">
           <h2>${code ? 'Done. You can close this tab.' : 'Authorisation failed'}</h2>
           <p>${code ? 'Return to your terminal for the refresh token.' : error || ''}</p>
         </body></html>`
      );
      server.close();
      code ? resolve(code) : reject(new Error(error || 'No code returned'));
    });
    server.listen(PORT);
    server.on('error', reject);
  });
}

(async () => {
  console.log('\n─── Google Drive backup: one-time authorisation ───\n');

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || (await ask('OAuth client ID: '));
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || (await ask('OAuth client secret: '));
  if (!clientId || !clientSecret) {
    console.error('\nBoth the client ID and secret are required. See docs/google-drive-backup.md\n');
    process.exit(1);
  }

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPE,
      // access_type=offline is what makes Google return a refresh token at all;
      // prompt=consent forces a NEW one even if you've authorised before.
      access_type: 'offline',
      prompt: 'consent',
    });

  console.log('\nSign in as the Google account that should OWN the backups.');
  console.log('If you see "Google hasn\'t verified this app", click Advanced then "Go to ... (unsafe)".');
  console.log('\nOpening:\n' + authUrl + '\n');
  openBrowser(authUrl);

  const code = await waitForCode();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.refresh_token) {
    console.error('\nToken exchange failed:', JSON.stringify(json, null, 2));
    if (json.error === 'invalid_client') console.error('The client ID/secret do not match, or the client is not a "Desktop app".');
    process.exit(1);
  }

  console.log('\n✅ Success. Add these to Vercel (Production + Preview):\n');
  console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`);
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${json.refresh_token}`);
  console.log('\n⚠️  Treat the refresh token like a password: it is long-lived and must');
  console.log('    never be committed. Put it ONLY in Vercel and your local .env.local.');
  console.log('\n⚠️  If the OAuth consent screen is still in "Testing", this token stops');
  console.log('    working in 7 days. Publish it to "In production" first.\n');
})().catch((err) => {
  console.error('\nAuthorisation failed:', err.message, '\n');
  process.exit(1);
});
