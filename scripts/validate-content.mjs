import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const contentRoot = path.join(root, 'content');
const assetsRoot = path.join(root, 'assets');
const schema = JSON.parse(await readFile(path.join(root, 'schemas/article.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);
const errors = [];
const articles = [];
const allowedTopLevel = new Set(['support', 'guides', 'legal', 'blog']);
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function error(file, message) { errors.push(`${path.relative(root, file).replaceAll('\\', '/')}: ${message}`); }
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}
function isRelativeTarget(target) {
  return target && !target.startsWith('#') && !target.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('//');
}
async function exists(file) { try { await stat(file); return true; } catch { return false; } }
function validateLocation(file, data) {
  const relative = path.relative(contentRoot, file).replaceAll('\\', '/');
  const segments = relative.split('/');
  if (segments[0] === 'support') {
    if (segments.length !== 3 || data.category !== segments[1]) error(file, 'support category must match content/support/<category>/');
  } else if (segments.length !== 2 || data.category !== segments[0]) {
    error(file, 'category must match the article type directory');
  }
  if ((data.type === 'guide' && segments[0] !== 'guides') || (data.type === 'legal' && segments[0] !== 'legal') || (data.type === 'blog' && segments[0] !== 'blog')) error(file, `type '${data.type}' is inconsistent with its directory`);
}
async function validateLinks(file, body) {
  const matches = [...body.matchAll(/!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+[^)]*)?\)/g)];
  for (const match of matches) {
    const target = match[1].replace(/^<|>$/g, '').split(/[?#]/, 1)[0];
    if (!isRelativeTarget(target)) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!resolved.startsWith(root + path.sep) || !(await exists(resolved))) error(file, `broken relative link or image: ${target}`);
  }
}

if (!(await exists(contentRoot))) {
  errors.push('content/: missing content directory');
} else {
  const files = await walk(contentRoot);
  for (const file of files) {
    const relative = path.relative(contentRoot, file).replaceAll('\\', '/');
    const segments = relative.split('/');
    if (segments.at(-1) === '.gitkeep') continue;
    if (segments.some((segment) => segment.includes(' ') || (!segment.endsWith('.md') && !kebab.test(segment)) || (segment.endsWith('.md') && !kebab.test(segment.slice(0, -3))))) error(file, 'path must use lowercase kebab-case names with no spaces');
    if (!allowedTopLevel.has(segments[0])) error(file, 'unsupported top-level content directory');
    if (!file.endsWith('.md')) { error(file, 'only Markdown article files are allowed under content/'); continue; }
    let parsed;
    try { parsed = matter(await readFile(file, 'utf8')); } catch (cause) { error(file, `invalid front matter: ${cause.message}`); continue; }
    if (!parsed.matter) { error(file, 'missing YAML front matter'); continue; }
    if (!validateSchema(parsed.data)) for (const issue of validateSchema.errors) error(file, `schema ${issue.instancePath || '/'} ${issue.message}`);
    if (!parsed.content.trim()) error(file, 'missing Markdown body content');
    if (parsed.data.title && parsed.data.description && parsed.data.title.trim().toLowerCase() === parsed.data.description.trim().toLowerCase()) error(file, 'description must not duplicate title');
    validateLocation(file, parsed.data);
    if ((relative.includes('/example-') || relative.startsWith('example-')) && parsed.data.status === 'published') error(file, 'example content must not be published');
    await validateLinks(file, parsed.content);
    articles.push({ file, data: parsed.data });
  }
}

for (const key of ['id', 'slug']) {
  const seen = new Map();
  for (const article of articles) if (article.data[key]) {
    if (seen.has(article.data[key])) error(article.file, `duplicate ${key} '${article.data[key]}' (also ${path.relative(root, seen.get(article.data[key]))})`);
    else seen.set(article.data[key], article.file);
  }
}
const slugs = new Map(articles.filter(({ data }) => data.status !== 'archived').map(({ file, data }) => [data.slug, file]));
const redirects = new Map();
for (const article of articles) for (const redirect of article.data.redirectFrom ?? []) {
  if (redirects.has(redirect)) error(article.file, `duplicate redirect '${redirect}' (also ${path.relative(root, redirects.get(redirect))})`);
  else redirects.set(redirect, article.file);
  if (slugs.has(redirect)) error(article.file, `redirect '${redirect}' collides with active slug (${path.relative(root, slugs.get(redirect))})`);
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${articles.length} Markdown article(s) checked.`);
}
