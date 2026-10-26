import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHECK, deriveKey, encrypt, lockSite, shell } from '../scripts/lock-site.mjs';

const bytes = (s: string) => Uint8Array.from(Buffer.from(s, 'base64'));

/** Decrypts the way the sign-in page and the page shells do, with WebCrypto. */
async function browserDecrypt(password: string, lock: { salt: string; iterations: number }, iv: string, data: string) {
  const subtle = globalThis.crypto.subtle;
  const base = await subtle.importKey('raw', new TextEncoder().encode(password.trim().toLowerCase()), 'PBKDF2', false, ['deriveBits']);
  const raw = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes(lock.salt), iterations: lock.iterations }, base, 256);
  const key = await subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  return new TextDecoder().decode(await subtle.decrypt({ name: 'AES-GCM', iv: bytes(iv) }, key, bytes(data)));
}

describe('site lock', () => {
  it('encrypts so the browser can decrypt with the same password, typed in any case', async () => {
    const key = deriveKey('Maple Orbit');
    const { iv, data } = encrypt(key, '<p>Arsenal</p>');
    expect(Buffer.from(data, 'base64').toString('utf8')).not.toContain('Arsenal');
    const raw = Uint8Array.from(key);
    const k = await globalThis.crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const plain = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(iv) }, k, bytes(data));
    expect(new TextDecoder().decode(plain)).toBe('<p>Arsenal</p>');
    expect(deriveKey('  maple orbit ').equals(key)).toBe(true);
  });

  it('locks every page except the sign-in page and removes RSC payloads and preview images', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'btj-lock-'));
    const write = (rel: string, text: string) => {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), text);
    };
    write('index.html', '<html><body>Who is buying your shirt?</body></html>');
    write('clubs/arsenal/index.html', '<html><body>Emirates: Serious</body></html>');
    write('clubs/arsenal/index.txt', '1:"Emirates"');
    write('opengraph-image.png', 'png');
    write('login/index.html', '<html><body>Sign in</body></html>');
    write('robots.txt', 'User-agent: *');
    write('404.html', '<html><body>Not found</body></html>');
    write('_next/static/chunks/app.js', 'console.log(1)');

    expect(lockSite(dir, 'maple-orbit')).toEqual({ pages: 2, removed: 2 });

    const club = fs.readFileSync(path.join(dir, 'clubs/arsenal/index.html'), 'utf8');
    expect(club).not.toContain('Emirates');
    expect(club).toContain('/login/?next=');
    expect(fs.readFileSync(path.join(dir, 'login/index.html'), 'utf8')).toContain('Sign in');
    expect(fs.existsSync(path.join(dir, 'clubs/arsenal/index.txt'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'opengraph-image.png'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'robots.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(dir, '404.html'), 'utf8')).toContain('Page not found');
    expect(fs.existsSync(path.join(dir, '_next/static/chunks/app.js'))).toBe(true);

    const lock = JSON.parse(fs.readFileSync(path.join(dir, 'login/lock.json'), 'utf8'));
    expect(await browserDecrypt('Maple-Orbit', lock, lock.iv, lock.check)).toBe(CHECK);
    await expect(browserDecrypt('wrong', lock, lock.iv, lock.check)).rejects.toThrow();

    const [, iv, data] = club.match(/iv: bytes\('([^']+)'\) \}, key, bytes\('([^']+)'\)/) ?? [];
    expect(await browserDecrypt('maple-orbit', lock, iv, data)).toContain('Emirates: Serious');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('builds a shell that sends people without a key to the sign-in page', () => {
    const html = shell({ iv: 'aXY=', data: 'ZGF0YQ==' });
    expect(html).toContain('noindex');
    expect(html).toContain("location.replace('/login/?next='");
  });
});
