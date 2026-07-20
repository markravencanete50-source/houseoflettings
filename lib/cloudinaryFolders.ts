// lib/cloudinaryFolders.ts
// One Cloudinary folder ("library") per upload source, so every form's files
// land separately instead of being mixed together — in particular, sensitive
// tenant/guarantor/landlord documents never share a folder with public
// property photos. Both upload routes (/api/upload and /api/cloudinary-sign)
// validate the requested folder against this single list, and the client forms
// import these constants so a folder name can never drift between the two ends.
//
// Framework-free on purpose (no server-only imports) so client components can
// import it too.

export const CLOUDINARY_FOLDERS = {
  properties: 'houseoflettings/properties',              // listing photos & video tours
  tenantApplications: 'houseoflettings/tenant-applications', // tenant ID, payslips, bank statements …
  guarantor: 'houseoflettings/guarantor',               // guarantor documents
  landlordDocs: 'houseoflettings/landlord-docs',        // landlord ID / billing / ownership / compliance docs
  landlordProperties: 'houseoflettings/landlord-properties', // property photos & floor plans from landlord registrations
  maintenance: 'houseoflettings/maintenance',           // maintenance report photos & videos
  serviceOrders: 'houseoflettings/service-orders',      // service-order proof of payment
  rentReview: 'houseoflettings/rent-review',            // rent-review documents & maintenance photos
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

export const ALLOWED_UPLOAD_FOLDERS: ReadonlySet<string> = new Set(Object.values(CLOUDINARY_FOLDERS));

/** True only for a folder on the canonical allowlist. A signature or upload for
 *  an arbitrary attacker-chosen folder is never issued. */
export function isAllowedFolder(folder: unknown): folder is string {
  return typeof folder === 'string' && ALLOWED_UPLOAD_FOLDERS.has(folder);
}
