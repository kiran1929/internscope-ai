import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://internscope.ai';

  const routes = [
    '',
    '/features',
    '/pricing',
    '/about',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
  ];

  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));
}
