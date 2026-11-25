// Optional maintainer checks. Uses only Node's built-ins, never npm.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, cp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checks = [];
async function check(name, fn) {
  try { await fn(); checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { checks.push({ name, passed: false, error: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}
const source = name => readFile(join(root, name), 'utf8');
const temp = await mkdtemp(join(tmpdir(), 'slotdrop-individual-check-'));
const originalFetch = globalThis.fetch;
try {
  for (const file of ['CatalogModel.js', 'CatalogViewModel.js', 'DetailViewModel.js']) await cp(join(root, file), join(temp, file));
  await writeFile(join(temp, 'config.js'), 'export const SUPABASE_URL="https://individual-fixture.supabase.co"; export const SUPABASE_PUBLISHABLE_KEY="sb_publishable_testfixture";');
  const model = await import(pathToFileURL(join(temp, 'CatalogModel.js')));
  const { availabilityLabel } = await import(pathToFileURL(join(temp, 'CatalogViewModel.js')));
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url: new URL(url), options };
    return new Response(JSON.stringify([{ id: 1, name: 'Workshop', price: 3000, stock: 2 }]), { status: 200 });
  };

  await check('zero, boundary and above-boundary predictions', () => {
    assert.deepEqual([0, 3, 4].map(availabilityLabel), ['Sold out', 'Only 3 seats left', 'Seats available']);
  });
  await check('singular low-stock text', () => assert.equal(availabilityLabel(1), 'Only 1 seat left'));
  await check('List uses the real products contract and read-only request', async () => {
    const rows = await model.listProducts();
    assert.equal(rows.length, 1);
    assert.equal(request.url.pathname, '/rest/v1/products');
    assert.equal(request.url.searchParams.get('select'), 'id,sku,name,category,price,stock,image_url');
    assert.equal(request.url.searchParams.get('order'), 'name.asc,id.asc');
    assert.equal(request.options.headers.apikey, 'sb_publishable_testfixture');
    assert.equal(request.options.method, undefined);
  });
  await check('search and category are query parameters, not client filtering', async () => {
    await model.listProducts({ query: ' Laro & mug? ', category: 'Pottery' });
    assert.equal(request.url.searchParams.get('name'), 'ilike.*Laro & mug?*');
    assert.equal(request.url.searchParams.get('category'), 'eq.Pottery');
    assert.equal([...request.url.searchParams.keys()].length, 4);
  });
  await check('search cannot inject extra query parameters', async () => {
    await model.listProducts({ query: 'x&stock=gt.0' });
    assert.equal(request.url.searchParams.has('stock'), false);
    assert.equal(request.url.searchParams.get('name'), 'ilike.*x&stock=gt.0*');
  });
  await check('blank search omits the name filter', async () => {
    await model.listProducts({ query: '   ' });
    assert.equal(request.url.searchParams.has('name'), false);
  });
  await check('Model translates the featured options chosen by the ViewModel', async () => {
    await model.listProducts({ stockFilter: 'gt.0', limit: 3, order: 'id.asc' });
    assert.equal(request.url.searchParams.get('limit'), '3');
    assert.equal(request.url.searchParams.get('stock'), 'gt.0');
  });
  await check('Detail fetches by id and limits the response', async () => {
    await model.getProduct('999999');
    assert.equal(request.url.searchParams.get('id'), 'eq.999999');
    assert.equal(request.url.searchParams.get('limit'), '1');
  });
  await check('200 with no rows stays an empty array', async () => {
    globalThis.fetch = async () => new Response('[]', { status: 200 });
    assert.deepEqual(await model.listProducts({ query: 'no-such-workshop' }), []);
    assert.deepEqual(await model.getProduct('999999'), []);
  });
  await check('HTTP failure is caught as a readable error', async () => {
    globalThis.fetch = async () => new Response('{"error":"denied"}', { status: 401 });
    await assert.rejects(model.listProducts(), /Could not load workshops \(401\)/);
  });
  await check('invalid JSON shape is refused', async () => {
    globalThis.fetch = async () => new Response('{"unexpected":true}', { status: 200 });
    await assert.rejects(model.listProducts(), /unreadable response/);
  });
  await check('Model has no React, state hook, DOM or availability rule', async () => {
    const code = (await source('CatalogModel.js')).replace(/\/\/[^\n]*/g, '');
    assert.doesNotMatch(code, /\b(?:React|document|window|useState|availabilityLabel)\b/);
  });
  await check('ViewModels have no fetch or DOM access', async () => {
    for (const file of ['CatalogViewModel.js', 'DetailViewModel.js']) {
      assert.doesNotMatch(await source(file), /\b(?:fetch|document|window|localStorage)\s*[.(]/);
    }
  });
  await check('View has no fetch, local state or stock rule', async () => {
    const code = await source('Catalog.js');
    assert.doesNotMatch(code, /\b(?:fetch|useState|useEffect|availabilityLabel)\s*\(/);
    assert.doesNotMatch(code, /\.stock\s*(?:[<>=!]|\?)/);
    assert.match(code, /useCatalogViewModel\(/);
  });
  await check('Only the Model knows Supabase connection names', async () => {
    for (const file of ['Catalog.js', 'CatalogViewModel.js', 'DetailViewModel.js']) assert.doesNotMatch(await source(file), /SUPABASE|supabase\.co|rest\/v1/);
  });
  await check('private local config is ignored', async () => assert.match(await source('.gitignore'), /^config\.js$/m));
  await check('no secret keys or elevated-role JWTs in project text', async () => {
    async function inspect(folder) {
      for (const item of await readdir(folder, { withFileTypes: true })) {
        if (['.git', '.local', 'recordings'].includes(item.name)) continue;
        const file = join(folder, item.name);
        if (item.isDirectory()) { await inspect(file); continue; }
        if (!/\.(?:js|mjs|html|md|sql|json|ps1)$/.test(item.name)) continue;
        const code = await readFile(file, 'utf8');
        assert.doesNotMatch(code, /\bsb_secret_[A-Za-z0-9]{16,}\b/, `${item.name} contains an elevated key`);
        for (const token of code.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []) {
          let claims;
          try { claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()); } catch { continue; }
          assert.notEqual(claims.role, 'service_role', `${item.name} contains an elevated JWT`);
        }
      }
    }
    await inspect(root);
  });
  await check('React and Babel are pinned CDN runtimes', async () => {
    const html = await source('index.html');
    assert.match(html, /react@18\.3\.1/);
    assert.match(html, /react-dom@18\.3\.1/);
    assert.match(html, /standalone@7\.28\.4/);
  });
  await check('no package installation or node_modules in project', async () => {
    const names = await readdir(root);
    assert.equal(names.includes('package.json'), false);
    assert.equal(names.includes('node_modules'), false);
  });
  await check('README and reflection fit the word limits', async () => {
    for (const [file, maximum] of [['README.md', 600], ['reflection.md', 400]]) {
      const words = (await source(file)).trim().split(/\s+/).length;
      assert.ok(words <= maximum, `${file}: ${words} words > ${maximum}`);
    }
  });
} finally {
  globalThis.fetch = originalFetch;
  const resolvedTemp = resolve(temp);
  if (!resolvedTemp.startsWith(resolve(tmpdir()) + sep) || !basename(resolvedTemp).startsWith('slotdrop-individual-check-')) throw new Error('Unexpected temporary cleanup path');
  await rm(resolvedTemp, { recursive: true, force: true });
}
const passed = checks.filter(check => check.passed).length;
console.log(`${passed}/${checks.length} checks passed. Model responses here are controlled test fixtures, not live database evidence.`);
if (passed !== checks.length) process.exitCode = 1;
