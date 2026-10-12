// Copies the label splitter from packages/shared (used by the apps) into the backend, so both read
// labels with exactly the same code. Runs before every build; label-parser.spec.ts fails if the
// committed copy drifts from the source.
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '../../packages/shared/src/labels.ts');
const dest = path.join(__dirname, '../src/modules/ingredients/shared-labels.ts');
if (!fs.existsSync(src)) {
  console.log('sync-shared: packages/shared not found, keeping the committed copy');
  process.exit(0);
}
const header = '// GENERATED from packages/shared/src/labels.ts by scripts/sync-shared.js. Do not edit here.\n\n';
fs.writeFileSync(dest, header + fs.readFileSync(src, 'utf8'));
console.log('sync-shared: labels.ts copied');
