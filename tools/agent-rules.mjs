#!/usr/bin/env node
/**
 * The kit's standing rules for the AI (kit 1.0.4): AGENT_RULES.md, kept in the game's CLAUDE.md and AGENTS.md between
 * two markers, so every session of Claude Code / Codex reads them, not only the one the kit was installed in (an AI
 * adding a feature later had forgotten crossOrigin, 2026-11-12). The rest of those files is the game's own and stays.
 * Run by bump-version.mjs at every build; also by hand. Plain Node 18+.
 *
 *   node docs/GMSDK_JS/tools/agent-rules.mjs [<gameRoot>]      default: the current folder (the game repo root)
 *
 * Prints the files it changed.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = dirname(dirname(fileURLToPath(import.meta.url)));
export const BEGIN = '<!-- GMSDK_JS:BEGIN: written by docs/GMSDK_JS/tools/agent-rules.mjs at every build; change docs/GMSDK_JS/AGENT_RULES.md, not here -->';
export const END = '<!-- GMSDK_JS:END -->';
export const FILES = ['CLAUDE.md', 'AGENTS.md'];

/** `text` with the rules block put in (replacing the old one), else added at the end. CRLF kept when the file has it. */
export function withRules(text, rules) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const block = [BEGIN, rules.replace(/\r?\n/g, '\n').trim(), END].join('\n').replace(/\n/g, nl);
  const a = text.indexOf('<!-- GMSDK_JS:BEGIN');
  const b = text.indexOf(END);
  if (a >= 0 && b > a) return text.slice(0, a) + block + text.slice(b + END.length);
  if (!text.trim()) return block + nl;
  return text.replace(/\s*$/, '') + nl + nl + block + nl;
}

/** Writes the rules into CLAUDE.md and AGENTS.md of `root` (made when missing); the files that changed. */
export function writeRules(root = process.cwd(), rulesFile = join(KIT, 'AGENT_RULES.md')) {
  if (!existsSync(rulesFile)) return [];
  const rules = readFileSync(rulesFile, 'utf8').replace(/^﻿/, '');
  const changed = [];
  for (const name of FILES) {
    const f = join(root, name);
    const before = existsSync(f) ? readFileSync(f, 'utf8') : '';
    const after = withRules(before, rules);
    if (after !== before) {
      writeFileSync(f, after);
      changed.push(name);
    }
  }
  return changed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const changed = writeRules(resolve(process.argv[2] ?? '.'));
  console.log(changed.length ? `kit rules written to ${changed.join(', ')}` : 'kit rules: CLAUDE.md, AGENTS.md up to date');
}
