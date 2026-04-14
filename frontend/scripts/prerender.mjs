import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { blogPosts } from './blog-posts.mjs';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const ssrDir = path.resolve(rootDir, 'dist-ssr');
const templatePath = path.resolve(distDir, 'index.html');
const ssrEntryPath = path.resolve(ssrDir, 'entry-server.js');
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://ausvisaservice.com').replace(/\/+$/, '');

const defaultPrerenderRoutes = ['/', '/about-us', '/contact-us', '/blog', '/pricing', '/visa-services'];

const routes = (process.env.PRERENDER_ROUTES ?? '')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

const effectiveRoutes = routes.length > 0 ? routes : defaultPrerenderRoutes;

const template = await fs.readFile(templatePath, 'utf-8');
const { render } = await import(pathToFileURL(ssrEntryPath).href);

for (const route of effectiveRoutes) {
  const { appHtml } = render(route);
  const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  const outputPath = route === '/' ? path.resolve(distDir, 'index.html') : path.resolve(distDir, route.slice(1), 'index.html');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, 'utf-8');
}

const publishedBlogRoutes = blogPosts
  .filter((post) => post.status === 'published' && post.visibility === 'public')
  .map((post) => ({
    loc: `${siteUrl}/blog/${post.slug}`,
    lastmod: new Date(post.updatedAt).toISOString().slice(0, 10)
  }));

const staticSitemapRoutes = effectiveRoutes
  .filter((route) => route.startsWith('/') && !route.startsWith('/dashboard') && !route.startsWith('/admin') && !route.startsWith('/user'))
  .map((route) => ({
    loc: `${siteUrl}${route === '/' ? '' : route}`,
    lastmod: new Date().toISOString().slice(0, 10)
  }));

const uniqueEntries = [...staticSitemapRoutes, ...publishedBlogRoutes].filter(
  (entry, index, entries) => entries.findIndex((candidate) => candidate.loc === entry.loc) === index
);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueEntries
  .map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`)
  .join('\n')}\n</urlset>\n`;

await fs.writeFile(path.resolve(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
await fs.rm(ssrDir, { recursive: true, force: true });
