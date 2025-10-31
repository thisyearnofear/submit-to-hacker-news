#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'chromium', 'manifest.json');
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

function loadEnvFile(filePath, { overrideExisting = false } = {}) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
      if (!match) return;
      let [, key, val] = match;
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (overrideExisting || !(key in process.env)) {
        process.env[key] = val;
      }
    });
  } catch (e) {
    console.warn('Failed to load env file:', filePath, e.message);
  }
}

function main() {
  // Load defaults from .env, then override with .env.local
  loadEnvFile(envPath, { overrideExisting: false });
  loadEnvFile(envLocalPath, { overrideExisting: true });

  // Collect tokens from multiple env names
  const candidates = [
    process.env.WRITER_REWRITER_TRIAL_TOKEN,
    process.env.WRITER_TRIAL_TOKEN,
    process.env.REWRITER_TRIAL_TOKEN,
    process.env.CHROME_TRIAL_TOKEN_WRITER,
    process.env.CHROME_TRIAL_TOKEN_REWRITER,
    process.env.PROOFREADER_TRIAL_TOKEN,
    process.env.CHROME_TRIAL_TOKEN_PROOFREADER,
  ].filter((v) => typeof v === 'string' && v.trim().length > 0);

  if (!fs.existsSync(manifestPath)) {
    console.error('Manifest not found at', manifestPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  // Ensure trial_tokens exists and contains tokens
  const tokens = candidates;
  if (!manifest.trial_tokens) {
    manifest.trial_tokens = tokens;
  } else {
    // Replace placeholders if present; otherwise append if missing
    const set = new Set(manifest.trial_tokens);
    tokens.forEach((tok) => set.add(tok));
    // Remove obvious placeholders
    const final = Array.from(set).filter((tok) => typeof tok === 'string' && !tok.startsWith('REPLACE_WITH_'));
    manifest.trial_tokens = final;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('Injected origin trial tokens into manifest.');
}

main();