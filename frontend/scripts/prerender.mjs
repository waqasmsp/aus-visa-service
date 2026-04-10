import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const ssrDir = path.resolve(rootDir, 'dist-ssr');
const templatePath = path.resolve(distDir, 'index.html');
const ssrEntryPath = path.resolve(ssrDir, 'entry-server.js');

const routes = (process.env.PRERENDER_ROUTES ?? '/')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

const template = await fs.readFile(templatePath, 'utf-8');
const { render } = await import(pathToFileURL(ssrEntryPath).href);

for (const route of routes) {
  const { appHtml } = render(route);
  const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  const outputPath = route === '/' ? path.resolve(distDir, 'index.html') : path.resolve(distDir, route.slice(1), 'index.html');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, 'utf-8');
}

await fs.rm(ssrDir, { recursive: true, force: true });
