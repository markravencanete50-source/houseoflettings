# Google Drive backup of form uploads

Every document a customer uploads goes to Cloudinary as before, and is now also
copied into Google Drive when the form is **submitted**. Nothing about the
upload experience changes.

## What lands in Drive

```
Cloudinary Back up file/
├── Tenant Application/
│   └── 2026-07-17 14-32 Jane Smith/
│       ├── Government ID.jpg
│       ├── Payslip 1.pdf … Payslip 3.pdf
│       ├── Bank Statement 1.pdf …
│       └── Tenancy Application Jane Smith.pdf   ← the generated PDF
├── Guarantor Form/
├── Landlord Registration/
└── Maintenance Report/
```

One folder per submission, stamped to the minute so a repeat submission from the
same person never merges into the earlier one. Files are named after **what the
document is**, not the customer's `scan001.pdf`.

## Why it is built this way

**It authorises as a user, not the Calendar service account.** A service account
has no Drive storage of its own. It can only own files inside a *Shared Drive*,
and Shared Drives need a Workspace tier this account doesn't have (Workspace
Individual). A service account writing to My Drive fails with
`403 storageQuotaExceeded`. So Drive uses an OAuth refresh token for the office
account, and the files are owned by (and count against) that account's 1TB.

**It uses the `drive.file` scope.** That grants access *only to files this app
itself created* — it cannot read the rest of the company Drive, so a leaked
token has a small blast radius. The trade-off: folders created by hand in the
Drive UI are invisible to the app, which is why it creates its own tree. Once
created you can drag the folder anywhere and rename it; ids don't change.

The alternative, full `drive` scope, is a *restricted* scope: publishing it
requires Google's verification review, and a leak would expose the whole Drive.

## One-time setup

### 1. Google Cloud console
1. Use the **same project** as the Calendar integration (or any project).
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen**
   - User type **External**.
   - Fill in app name + your email. No logo needed.
   - **Scopes: add `.../auth/drive.file`** — it is listed as non-sensitive.
   - **⚠️ Publishing status: click "PUBLISH APP" → "In production".**
     If you leave it on **Testing, Google revokes the refresh token after
     exactly 7 days** and the backup stops with no visible sign on the site.
     Because `drive.file` is non-sensitive, publishing needs **no** verification
     review — it's instant.
4. **Credentials → Create credentials → OAuth client ID → Application type:
   Desktop app.** Copy the **client ID** and **client secret**.
   (Desktop app is what allows the `http://localhost:5555` redirect the script
   below uses. Don't pick "Web application".)

### 2. Mint the refresh token (on your own machine)

```bash
node scripts/google-drive-auth.js
```

It asks for the client ID/secret, opens a Google consent screen, and prints the
three env vars. **Sign in as the account that should own the backups.** If you
see "Google hasn't verified this app", click **Advanced → Go to … (unsafe)** —
expected for an unverified app used by its own author.

### 3. Add to Vercel (Production + Preview)

| Variable | Value |
|---|---|
| `GOOGLE_DRIVE_CLIENT_ID` | from step 1 |
| `GOOGLE_DRIVE_CLIENT_SECRET` | from step 1 |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | from step 2 |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | *optional*, see below |

Redeploy. Until all three are set the backup silently no-ops and submissions
behave exactly as before.

### 4. First submission
Submit any form. The app creates `Cloudinary Back up file` in the **root of My
Drive**. Drag it into `House of Lettings` next to the folders you made by hand,
and delete the empty hand-made ones — the app tracks the folder by id, so moving
it is safe.

Optionally pin it: copy the id from the folder's URL
(`drive.google.com/drive/folders/<THIS>`) into `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
**Only ever pin a folder the app created** — it cannot see any other folder
under `drive.file`, and every upload would 404.

## Troubleshooting

Failures are logged, never surfaced to the customer. Check the Vercel function
logs for `Drive backup failed` / `Drive backup file failed`.

| Symptom | Cause |
|---|---|
| `invalid_grant` on token refresh | Consent screen still on **Testing** (7-day expiry), or access revoked at [myaccount.google.com/permissions](https://myaccount.google.com/permissions). Publish to production and re-run the script. |
| `Could not fetch …: 401` on **PDFs only** | Cloudinary blocks PDF delivery by default. Enable **Settings → Security → "PDF and ZIP files delivery"** (account `dewbvnurv`). Images are unaffected. |
| `404` on every upload | `GOOGLE_DRIVE_ROOT_FOLDER_ID` points at a folder the app didn't create. Clear it. |
| Backup stops after ~1TB | The owning account's storage is full. |

## Gotchas for future work

- **Never un-await `backupToDrive`.** Vercel freezes the function once the
  response returns, which would silently drop the uploads — the same bug that
  once ate the Resend emails.
- `backupToDrive` never throws. Don't wrap it in a try/catch expecting one.
- Adding a new upload field means adding it to that route's `files:` array;
  there is no automatic discovery.
- The four `maxDuration: 60` entries in `vercel.json` exist because a submission
  now fetches from Cloudinary and re-uploads to Drive.
