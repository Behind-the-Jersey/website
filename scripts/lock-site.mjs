// Locks the built site behind the team password (run by scripts/build-pages.sh after both builds).
//
// GitHub Pages only serves files, so the password can't be checked on a server. Instead every page
// in out/ is published encrypted (AES-256-GCM, with a key derived from the password by PBKDF2) and
// replaced by a small shell that decrypts it in the browser with the key the sign-in page
// (public/login/index.html) stored. Without the password the pages can't be read. Next's RSC
// payloads (*.txt) and the Open Graph images carry page content too, so they're removed: links
// then load whole (encrypted) pages instead of client-side transitions.
//
// Images, fonts, scripts and the film stay readable by direct link; they hold no ratings or text.
//
//   SITE_PASSWORD=...      the team password (a GitHub Actions secret for the Pages build)
//   BTJ_REQUIRE_LOCK=1     fail instead of publishing an unlocked site when SITE_PASSWORD is missing
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Fixed, public salt: the derived key stays the same across deploys, so people stay signed in. */
export const SALT = 'X4oSaHrBbPHHUHuh765TCA==';
export const ITERATIONS = 600000;
/** What the sign-in page decrypts to check a password. */
export const CHECK = 'behind-the-jersey';
/** Pages that must stay readable: the sign-in page itself. */
const PUBLIC_PAGES = new Set(['login/index.html']);
/** Next's not-found pages: they hold no data, and Next's link prefetches (whose RSC payloads are
 * removed below) all get one, so they're replaced by a small page rather than encrypted. */
const NOT_FOUND = /(^|\/)404(\/index)?\.html$/;

export function notFound() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Page not found · Behind the Jersey</title>
<style>html,body{margin:0;background:#0f0d0c;color:#f3ede6;font:16px/1.5 system-ui,sans-serif}
main{max-width:480px;margin:0 auto;padding:64px 16px}h1{font-size:28px;margin:0 0 12px}a{color:#ff6b5e}</style>
</head><body><main><h1>Page not found</h1><p>There’s no page at this address. <a href="/">Go to the home page</a>.</p></main></body></html>
`;
}

/** The password as people type it: case and surrounding spaces don't matter. */
export const normalise = (password) => password.trim().toLowerCase();

export function deriveKey(password) {
  return crypto.pbkdf2Sync(normalise(password), Buffer.from(SALT, 'base64'), ITERATIONS, 32, 'sha256');
}

/** AES-256-GCM, laid out as WebCrypto expects: ciphertext followed by the 16-byte tag. */
export function encrypt(key, text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return { iv: iv.toString('base64'), data: data.toString('base64') };
}

/** The page published in place of an encrypted one. */
export function shell({ iv, data }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Behind the Jersey</title>
<style>html,body{margin:0;background:#0f0d0c;color:#f3ede6;font-family:system-ui,sans-serif}</style>
</head><body>
<noscript><p style="padding:24px">This site is private. It needs JavaScript and the team password: <a href="/login/" style="color:#ff6b5e">sign in</a>.</p></noscript>
<script>
(async function () {
  var KEY = 'btj-site-key';
  var signIn = function () {
    location.replace('/login/?next=' + encodeURIComponent(location.pathname + location.search + location.hash));
  };
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!saved || !saved.k || !(saved.exp > Date.now())) return signIn();
  var bytes = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
  try {
    var key = await crypto.subtle.importKey('raw', bytes(saved.k), 'AES-GCM', false, ['decrypt']);
    var html = new TextDecoder().decode(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes('${iv}') }, key, bytes('${data}')),
    );
    // Swap the decrypted page in the way a browser would load it: all of its HTML first, then its
    // scripts in order (document.write lets React start before the page is complete).
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var root = document.documentElement;
    Array.prototype.slice.call(root.attributes).forEach(function (a) { root.removeAttribute(a.name); });
    Array.prototype.slice.call(doc.documentElement.attributes).forEach(function (a) { root.setAttribute(a.name, a.value); });
    var scripts = [];
    doc.querySelectorAll('script').forEach(function (old) {
      var mark = doc.createComment('');
      scripts.push([mark, old]);
      old.replaceWith(mark);
    });
    document.head.replaceWith(document.adoptNode(doc.head));
    document.body.replaceWith(document.adoptNode(doc.body));
    scripts.forEach(function (pair) {
      var s = document.createElement('script');
      Array.prototype.slice.call(pair[1].attributes).forEach(function (a) { s.setAttribute(a.name, a.value); });
      s.text = pair[1].text;
      pair[0].replaceWith(s);
    });
  } catch (e) {
    try { localStorage.removeItem(KEY); } catch (e2) {}
    signIn();
  }
})();
</script>
</body></html>
`;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

export function lockSite(outDir, password) {
  const key = deriveKey(password);
  let pages = 0;
  let removed = 0;
  for (const file of walk(outDir)) {
    const rel = path.relative(outDir, file).split(path.sep).join('/');
    if (rel.endsWith('.html')) {
      if (PUBLIC_PAGES.has(rel)) continue;
      if (NOT_FOUND.test(rel)) {
        fs.writeFileSync(file, notFound());
        continue;
      }
      fs.writeFileSync(file, shell(encrypt(key, fs.readFileSync(file, 'utf8'))));
      pages++;
    } else if ((rel.endsWith('.txt') && rel !== 'robots.txt') || /(^|\/)(opengraph|twitter)-image[^/]*$/.test(rel)) {
      fs.rmSync(file);
      removed++;
    }
  }
  const check = encrypt(key, CHECK);
  fs.mkdirSync(path.join(outDir, 'login'), { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'login', 'lock.json'),
    JSON.stringify({ salt: SALT, iterations: ITERATIONS, iv: check.iv, check: check.data }),
  );
  return { pages, removed };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const outDir = process.argv[2] || 'out';
  const password = process.env.SITE_PASSWORD || '';
  if (!password) {
    if (process.env.BTJ_REQUIRE_LOCK === '1') {
      console.error('lock-site: SITE_PASSWORD is not set; refusing to publish an unlocked site.');
      process.exit(1);
    }
    console.log('lock-site: SITE_PASSWORD not set, site left unlocked (local build).');
    process.exit(0);
  }
  const { pages, removed } = lockSite(outDir, password);
  console.log(`lock-site: ${pages} pages encrypted, ${removed} payload and preview files removed.`);
}
