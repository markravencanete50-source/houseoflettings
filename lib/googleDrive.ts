// lib/googleDrive.ts
// Mirrors form uploads from Cloudinary into Google Drive, so the office keeps a
// copy of every document a customer submits. No external npm dependency — the
// Drive REST API is called with fetch.
//
// WHY OAUTH AND NOT THE CALENDAR SERVICE ACCOUNT: a Google service account has
// no Drive storage quota of its own. It can only own files inside a Shared
// Drive, and Shared Drives need a Workspace tier that this account doesn't have
// (Workspace Individual). A service account writing to My Drive fails with
// 403 storageQuotaExceeded. So Drive is authorised as the office USER via a
// refresh token, and the files are owned by (and billed to) that account.
//
// WHY drive.file AND NOT drive: drive.file is a non-sensitive scope that grants
// access ONLY to files this app itself created. It cannot read the rest of the
// company Drive, so a leaked token has a small blast radius. The trade-off is
// that folders created by hand in the Drive UI are invisible to us, which is
// why the folder tree below is created by this code. Moving or renaming those
// folders in Drive is safe: ids don't change, and we address everything by id.
//
// Activates only when these env vars are set, otherwise it silently no-ops so
// submissions keep working without Drive configured:
//   GOOGLE_DRIVE_CLIENT_ID       OAuth client id (Desktop app)
//   GOOGLE_DRIVE_CLIENT_SECRET   OAuth client secret
//   GOOGLE_DRIVE_REFRESH_TOKEN   from `node scripts/google-drive-auth.js`
//   GOOGLE_DRIVE_ROOT_FOLDER_ID  optional; pins the backup root to one folder
//
// Setup lives in docs/google-drive-backup.md.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";

// The consent screen must be published "In production". A client left in
// "Testing" has its refresh tokens revoked by Google after 7 days, which would
// stop the backup a week after setup with no visible error on the site.
const ROOT_FOLDER_NAME = "Cloudinary Back up file";

export type BackupFormType =
  | "tenant-application"
  | "guarantor"
  | "landlord-registration"
  | "landlord-agreement"
  | "maintenance"
  | "rent-review";

// Folder names match the ones the office already uses in Drive.
const FORM_FOLDERS: Record<BackupFormType, string> = {
  "tenant-application": "Tenant Application",
  guarantor: "Guarantor Form",
  "landlord-registration": "Landlord Registration",
  "landlord-agreement": "Landlord Agreements",
  maintenance: "Maintenance Report",
  "rent-review": "Rent Review",
};

export interface BackupFile {
  /** A Cloudinary URL to fetch and mirror. */
  url?: string;
  /** Inline content, already base64 (used for the generated application PDF). */
  base64?: string;
  /** Label for the file in Drive, e.g. "Payslip 1". An extension is added. */
  name: string;
}

/**
 * Turns one form field's Cloudinary URLs into labelled backup files, e.g.
 * ["...a.pdf", "...b.pdf"] + "Payslip" -> "Payslip 1", "Payslip 2".
 * A single file keeps the bare label. Tolerates undefined/non-array fields,
 * which is what an older submission or a skipped optional field looks like.
 */
export function namedFiles(urls: unknown, label: string): BackupFile[] {
  if (!Array.isArray(urls)) return [];
  const valid = urls.filter((u): u is string => typeof u === "string" && u.trim() !== "");
  return valid.map((url, i) => ({ url, name: valid.length > 1 ? `${label} ${i + 1}` : label }));
}

export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  );
}

// ── access token ──────────────────────────────────────────────────────────────
// Access tokens last an hour. Cached in module scope so a submission with eight
// documents does one token exchange rather than eight. A warm Vercel lambda
// reuses it across requests; a cold one just mints a new one.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getDriveAccessToken(): Promise<string> {
  const now = Date.now();
  // 60s of slack so a token can't expire mid-upload.
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.value;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET as string,
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN as string,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // invalid_grant here almost always means the consent screen is still in
    // "Testing" (7-day token expiry) or access was revoked. See the docs.
    throw new Error(`Drive token refresh failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  cachedToken = {
    value: json.access_token as string,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

// ── folders ───────────────────────────────────────────────────────────────────
// Keyed by `${parentId}/${name}`. Only holds folders this app created, so it
// stays correct even if the office moves the tree elsewhere in Drive.
const folderCache = new Map<string, string>();

// A single quote is the only character that can break out of the `q` string.
const escapeQ = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string | null
): Promise<string> {
  const cacheKey = `${parentId ?? "root"}/${name}`;
  const hit = folderCache.get(cacheKey);
  if (hit) return hit;

  const q = [
    `name = '${escapeQ(name)}'`,
    `mimeType = '${FOLDER_MIME}'`,
    "trashed = false",
    `'${parentId ?? "root"}' in parents`,
  ].join(" and ");

  const listRes = await fetch(
    `${FILES_URL}?${new URLSearchParams({ q, fields: "files(id,name)", pageSize: "1" })}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (listRes.ok) {
    const json = await listRes.json();
    const found = json.files?.[0]?.id as string | undefined;
    if (found) {
      folderCache.set(cacheKey, found);
      return found;
    }
  }

  const createRes = await fetch(FILES_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  if (!createRes.ok) {
    throw new Error(
      `Drive folder create failed (${name}): ${createRes.status} ${await createRes
        .text()
        .catch(() => "")}`
    );
  }
  const created = await createRes.json();
  folderCache.set(cacheKey, created.id);
  return created.id as string;
}

async function getRootFolderId(token: string): Promise<string> {
  const pinned = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  // A pinned id must be a folder this app created, otherwise drive.file can't
  // see it and every upload 404s.
  if (pinned) return pinned;
  return findOrCreateFolder(token, ROOT_FOLDER_NAME, null);
}

// ── file upload ───────────────────────────────────────────────────────────────
const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
};

// Drive tolerates most characters, but slashes read as paths in some clients
// and control characters break the multipart metadata.
const safeFileName = (s: string) =>
  s.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "file";

function extensionFor(mime: string, url?: string): string {
  const known = EXT_BY_MIME[mime.split(";")[0].trim().toLowerCase()];
  if (known) return known;
  // Fall back to Cloudinary's own extension, e.g. ".../v123/abc.pdf".
  const fromUrl = url?.split("?")[0].match(/\.([a-z0-9]{2,5})$/i)?.[1];
  return fromUrl ? `.${fromUrl.toLowerCase()}` : "";
}

async function uploadBuffer(
  token: string,
  opts: { name: string; mimeType: string; body: Buffer; parentId: string }
): Promise<string> {
  const boundary = `hol${Math.random().toString(36).slice(2)}${opts.body.length}`;
  const metadata = JSON.stringify({ name: opts.name, parents: [opts.parentId] });

  // Built as Buffers: the file part is binary and would be corrupted by string
  // concatenation.
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${opts.mimeType}\r\n\r\n`
    ),
    opts.body,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const res = await fetch(`${UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: body as unknown as BodyInit,
  });
  if (!res.ok) {
    throw new Error(`Drive upload failed (${opts.name}): ${res.status} ${await res.text().catch(() => "")}`);
  }
  return (await res.json()).id as string;
}

async function fetchCloudinary(url: string): Promise<{ body: Buffer; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    // A 401 on a PDF means Cloudinary's "PDF and ZIP files delivery" setting is
    // off (Settings > Security). Images are unaffected, so this fails per-file
    // rather than for the whole submission.
    throw new Error(`Could not fetch ${url}: ${res.status}`);
  }
  const mimeType = res.headers.get("content-type") || "application/octet-stream";
  return { body: Buffer.from(await res.arrayBuffer()), mimeType };
}

// ── public entry point ────────────────────────────────────────────────────────
export interface BackupResult {
  configured: boolean;
  uploaded: number;
  failed: number;
  folderId?: string;
}

/**
 * Mirror one submission's documents into Drive, under
 * `<root>/<Form folder>/<Name> - <Address>/`.
 *
 * Never throws and never rejects: a backup problem must not cost the business a
 * lead, so callers await it purely for the log line. Failures are per-file, so
 * one unreadable document doesn't lose the other seven.
 */
export async function backupToDrive(opts: {
  formType: BackupFormType;
  /** Who it's from: the applicant, guarantor, tenant or company. */
  label: string;
  /** The property it concerns. Omitted only if the form has no address. */
  address?: string;
  files: BackupFile[];
}): Promise<BackupResult> {
  if (!isDriveConfigured()) return { configured: false, uploaded: 0, failed: 0 };

  const files = opts.files.filter((f) => f.url || f.base64);
  if (files.length === 0) return { configured: true, uploaded: 0, failed: 0 };

  try {
    const token = await getDriveAccessToken();
    const rootId = await getRootFolderId(token);
    const formFolderId = await findOrCreateFolder(token, FORM_FOLDERS[opts.formType], rootId);

    // Named for the person and the property, because that is how the office
    // looks a submission up. Deliberately no date: Drive already shows one in
    // its own column, so a date here only pushed the useful part of the name
    // off the edge. Capped so a long address stays readable in the Drive grid.
    const submissionFolder = safeFileName(
      [opts.label || "Unnamed", opts.address].filter(Boolean).join(" - ")
    ).slice(0, 120).trim();

    const createRes = await fetch(FILES_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: submissionFolder,
        mimeType: FOLDER_MIME,
        parents: [formFolderId],
      }),
    });
    if (!createRes.ok) {
      throw new Error(`Drive submission folder failed: ${createRes.status} ${await createRes.text().catch(() => "")}`);
    }
    const parentId = (await createRes.json()).id as string;

    // Uploaded in parallel: sequential would put a form submit at the mercy of
    // eight round trips and risk the function timeout.
    const results = await Promise.allSettled(
      files.map(async (f) => {
        const { body, mimeType } = f.base64
          ? { body: Buffer.from(f.base64, "base64"), mimeType: "application/pdf" }
          : await fetchCloudinary(f.url as string);
        const name = safeFileName(f.name) + extensionFor(mimeType, f.url);
        return uploadBuffer(token, { name, mimeType, body, parentId });
      })
    );

    const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    failures.forEach((r) => console.error("Drive backup file failed:", r.reason?.message || r.reason));

    return {
      configured: true,
      uploaded: results.length - failures.length,
      failed: failures.length,
      folderId: parentId,
    };
  } catch (err: any) {
    console.error(`Drive backup failed (${opts.formType}):`, err?.message || err);
    return { configured: true, uploaded: 0, failed: files.length };
  }
}
