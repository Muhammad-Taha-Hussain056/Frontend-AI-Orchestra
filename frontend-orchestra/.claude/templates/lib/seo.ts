import type { Metadata } from 'next';

export function buildMetadata(o: { title: string; description: string; path: string; image?: string; noindex?: boolean }): Metadata {
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: { title: o.title, description: o.description, url: o.path, type: 'website', images: o.image ? [o.image] : undefined },
    twitter: { card: 'summary_large_image', title: o.title, description: o.description },
    robots: o.noindex ? { index: false, follow: false } : undefined,
  };
}
