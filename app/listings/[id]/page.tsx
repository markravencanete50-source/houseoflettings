// app/listings/[id]/page.tsx
import { getProperty } from '@/services/property';
import PropertyDetailClient from './PropertyDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  return <PropertyDetailClient property={property} />;
}
