// app/sitemap.ts
import { MetadataRoute } from 'next';
import { BRANCHES } from '@/lib/branches';
import { BUNDLES } from '@/lib/bundles';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.houseoflettings.uk';

  const branchUrls: MetadataRoute.Sitemap = BRANCHES.map((b) => ({
    url: `${baseUrl}/branches/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Individual landlord package detail pages.
  const packageUrls: MetadataRoute.Sitemap = BUNDLES.map((b) => ({
    url: `${baseUrl}/pricing/${b.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/branches`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...branchUrls,
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...packageUrls,
    {
      url: `${baseUrl}/landlords`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/landlords/start-here`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/additional-services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
