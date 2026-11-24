import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { treeData } from '../src/data/memories.js';

const origin = process.env.NGINX_TEST_URL;
if (!origin) throw new Error('Set NGINX_TEST_URL to a local Nginx instance serving dist-app and public/memories.');
const items = treeData.children.flatMap(category => category.children);
const assets = readdirSync(new URL('../dist-app/assets/', import.meta.url));
const headers = { Host: 'tram-van.example.com' };
const request = (path, options = {}) => fetch(new URL(path, origin), {
  ...options,
  headers: { ...headers, ...options.headers },
  redirect: 'manual',
});

function assertSecurity(response) {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert(response.headers.get('content-security-policy')?.includes("worker-src 'self' blob:"));
  assert(!response.headers.has('strict-transport-security'));
}

test('HTML and mutable background revalidate, with security headers on 200 and 304', async () => {
  for (const path of ['/', '/bg.webp']) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assertSecurity(response);
    await response.arrayBuffer();
    const cached = await request(path, { headers: { 'If-None-Match': response.headers.get('etag') } });
    assert.equal(cached.status, 304);
    assert.equal(cached.headers.get('cache-control'), 'no-cache');
    assertSecurity(cached);
  }
});

test('hashed JS and the module worker have the right MIME type, gzip and immutable cache', async () => {
  for (const name of [assets.find(name => /^index-.*\.js$/.test(name)), assets.find(name => name.endsWith('.mjs'))]) {
    assert(name);
    const response = await request('/assets/' + name, { headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/javascript/);
    assert.equal(response.headers.get('content-encoding'), 'gzip');
    assert.match(response.headers.get('vary'), /Accept-Encoding/i);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assertSecurity(response);
    // fetch decodes gzip: make sure the transmitted content is intact.
    assert(Buffer.from(await response.arrayBuffer()).equals(readFileSync(new URL('../dist-app/assets/' + name, import.meta.url))));
  }
});

test('video and PDF byte ranges return exactly the requested bytes', async () => {
  for (const item of items.filter(item => /\.(mp4|pdf)$/.test(item.file))) {
    const head = await request(item.file, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('accept-ranges'), 'bytes');
    const response = await request(item.file, { headers: { Range: 'bytes=0-1023', 'Accept-Encoding': 'gzip' } });
    const path = new URL('../public' + item.file, import.meta.url);
    const size = statSync(path).size;
    assert.equal(response.status, 206, item.file);
    assert.equal(response.headers.get('content-range'), `bytes 0-1023/${size}`);
    assert.equal(response.headers.get('content-encoding'), null);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600, must-revalidate');
    assert.match(response.headers.get('content-type'), item.file.endsWith('.pdf') ? /^application\/pdf/ : /^video\/mp4/);
    assertSecurity(response);
    const expected = Buffer.alloc(1024);
    const descriptor = openSync(path, 'r');
    try { readSync(descriptor, expected, 0, expected.length, 0); } finally { closeSync(descriptor); }
    assert(Buffer.from(await response.arrayBuffer()).equals(expected));
  }
});

test('Unicode filenames and DOCX MIME types work for all catalog documents', async () => {
  for (const item of items.filter(item => item.file.endsWith('.docx'))) {
    const response = await request(item.file, { method: 'HEAD' });
    assert.equal(response.status, 200, item.file);
    assert.equal(response.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    assert.equal(Number(response.headers.get('content-length')), statSync(new URL('../public' + item.file, import.meta.url)).size);
    assertSecurity(response);
  }
});

test('missing files and hidden paths return 404 with no-store and security headers', async () => {
  for (const path of ['/assets/missing.js', '/memories/missing.pdf', '/.git/config', '/memories/.hidden', '/bg.png', '/not-a-page']) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assertSecurity(response);
    await response.arrayBuffer();
  }
});

test('directory redirects stay relative behind the tunnel', async () => {
  const response = await request('/memories');
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), '/memories/');
});
