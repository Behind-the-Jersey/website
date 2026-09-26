// Where the data comes from. Pages never read files directly: they go through lib/data/index.ts,
// which asks one of these sources for the raw JSON and validates it.
//
//   BTJ_DATA_SOURCE=seed (default)  data/seed/*.json in this repo (the design handover's data; /demo/)
//   BTJ_DATA_SOURCE=live            data/live/*.json: a release of Beyond-The-Jersey/data, copied in and
//                                   reviewed in a pull request (npm run data:live). The live site uses it.
//   BTJ_DATA_SOURCE=release         a release downloaded by npm run data:pull, in $BTJ_DATA_DIR
//                                   (default .data-release), before it's reviewed
//   BTJ_DATA_SOURCE=api             $BTJ_DATA_URL/<file>.json over HTTP, with $BTJ_DATA_TOKEN as a bearer
//                                   token if set (e.g. https://github.com/Beyond-The-Jersey/data/releases/latest/download)
import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_FILES, type RawDataset } from './schema';

/** Data that can't be loaded or doesn't validate. The message is meant for people. */
export class DataError extends Error {}

/** Raw, unvalidated file contents keyed by file name. */
export type RawFiles = Partial<Record<keyof RawDataset, unknown>>;

export interface DataSource {
  readonly name: string;
  /** Human-readable location, for error messages. */
  readonly location: string;
  load(): Promise<RawFiles>;
}

/** Files a source may leave out. contacts is new; meta falls back to the latest change date. */
export const OPTIONAL_FILES: (keyof RawDataset)[] = ['contacts', 'meta'];

export class DirectorySource implements DataSource {
  constructor(
    readonly name: string,
    readonly location: string,
  ) {}

  async load(): Promise<RawFiles> {
    const out: RawFiles = {};
    for (const file of DATA_FILES) {
      const p = path.join(this.location, `${file}.json`);
      try {
        out[file] = JSON.parse(await fs.readFile(p, 'utf8'));
      } catch (e) {
        const missing = (e as NodeJS.ErrnoException).code === 'ENOENT';
        if (missing && OPTIONAL_FILES.includes(file)) continue;
        throw new DataError(`${this.name} data: can't read ${p}: ${(e as Error).message}`);
      }
    }
    return out;
  }
}

export class HttpSource implements DataSource {
  readonly name = 'api';
  constructor(
    readonly location: string,
    private token?: string,
  ) {}

  async load(): Promise<RawFiles> {
    const out: RawFiles = {};
    const headers: Record<string, string> = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    for (const file of DATA_FILES) {
      const url = `${this.location.replace(/\/$/, '')}/${file}.json`;
      const res = await fetch(url, { headers });
      if (res.status === 404 && OPTIONAL_FILES.includes(file)) continue;
      if (!res.ok) throw new DataError(`api data: ${url} returned ${res.status}`);
      out[file] = await res.json();
    }
    return out;
  }
}

export const SEED_DIR = path.join(process.cwd(), 'data', 'seed');
export const LIVE_DIR = path.join(process.cwd(), 'data', 'live');

export function sourceFromEnv(env: NodeJS.ProcessEnv = process.env): DataSource {
  const kind = env.BTJ_DATA_SOURCE ?? 'seed';
  switch (kind) {
    case 'seed':
      return new DirectorySource('seed', SEED_DIR);
    case 'live':
      return new DirectorySource('live', LIVE_DIR);
    case 'release':
      return new DirectorySource('release', path.resolve(env.BTJ_DATA_DIR ?? '.data-release'));
    case 'api':
      if (!env.BTJ_DATA_URL) throw new Error('BTJ_DATA_SOURCE=api needs BTJ_DATA_URL');
      return new HttpSource(env.BTJ_DATA_URL, env.BTJ_DATA_TOKEN);
    default:
      throw new Error(`Unknown BTJ_DATA_SOURCE "${kind}". Use seed, live, release or api.`);
  }
}
