// app/listings/[id]/page.tsx
export const dynamic = 'force-dynamic';

import PropertyDetailClient from './PropertyDetailClient';

export default function PropertyDetailPage() {
  return <PropertyDetailClient />;
}
