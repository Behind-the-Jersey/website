// Types for scripts/lock-site.mjs, used by tests/lock-site.test.ts.
export const SALT: string;
export const ITERATIONS: number;
export const CHECK: string;
export function normalise(password: string): string;
export function deriveKey(password: string): Buffer;
export function encrypt(key: Buffer, text: string): { iv: string; data: string };
export function shell(blob: { iv: string; data: string }): string;
export function lockSite(outDir: string, password: string): { pages: number; removed: number };
export function notFound(): string;
