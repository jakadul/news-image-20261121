// main.ts — copies the day's front page to /output/entry.png
// language: TypeScript/ESM for Node 22, platform: linux x64 (make.fun sandbox, no network)
// Contract: /output/entry.png must be a whole PNG or JPEG, at most 1 MiB, at most 1024x1024.

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// The page carries twelve dated stories across eight regions: legible at the
// ~300px width the judge reads it at, which a denser page could not be.
const STORY_COUNT = 12;
if (STORY_COUNT < 1) throw new Error('no stories on the page');
const SRC = join(import.meta.dirname, 'front-page.png');

// Fail loudly in the sandbox rather than ship a file the gate would refuse:
// a whole PNG or JPEG, at most 1 MiB, at most 1024x1024 pixels.
const bytes = statSync(SRC).size;
const head = readFileSync(SRC).subarray(0, 8);
const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
const isJpeg = head[0] === 0xff && head[1] === 0xd8;
if (!isPng && !isJpeg) throw new Error('entry.png is neither a PNG nor a JPEG');
if (bytes > 1048576) throw new Error(`entry.png is ${bytes} bytes, over the 1 MiB cap`);

// The gate also caps the pixel size at 1024x1024: read it straight out of the
// PNG's IHDR chunk rather than trusting the file we drew.
if (isPng) {
  const buf = readFileSync(SRC);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width > 1024 || height > 1024) {
    throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 cap`);
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SRC, join(OUTPUT_DIR, 'entry.png'));
